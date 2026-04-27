import json
import os
import re
import string
import numpy as np
import pandas as pd
import faiss


def _spearman_r(a: np.ndarray, b: np.ndarray) -> float:
    """
    Compute Spearman rank correlation without external deps.
    Returns in [-1, 1]. Handles constant arrays.
    """
    if a.size == 0 or b.size == 0:
        return 0.0
    a_ranks = pd.Series(a).rank(method="average").to_numpy()
    b_ranks = pd.Series(b).rank(method="average").to_numpy()
    a_center = a_ranks - a_ranks.mean()
    b_center = b_ranks - b_ranks.mean()
    denom = (np.linalg.norm(a_center) * np.linalg.norm(b_center)) + 1e-9
    return float(np.dot(a_center, b_center) / denom)


def _ensure_data_dir(path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)


class JobRecommendationSystem:
    def __init__(self, jobs_csv: str):
        """
        Load job data and precompute embeddings + FAISS index.
        Required columns in CSV:
          - 'Job Id', 'workplace', 'working_mode', 'position',
            'job_role_and_duties', 'requisite_skill'
        Optional: 'salary', 'offer_details'
        """
        if not os.path.exists(jobs_csv):
            raise FileNotFoundError(f"Jobs CSV not found: {jobs_csv}")

        self.jobs_df = pd.read_csv(jobs_csv)
        self.jobs_df["job_text"] = (
            self.jobs_df["workplace"].astype(str) + " " +
            self.jobs_df["working_mode"].astype(str) + " " +
            self.jobs_df["position"].astype(str) + " " +
            self.jobs_df["job_role_and_duties"].astype(str) + " " +
            self.jobs_df["requisite_skill"].astype(str)
        )

        self.job_info = self.jobs_df.copy()
        self.jobs_texts = self.jobs_df["job_text"].tolist()

        base_dir = os.path.dirname(__file__)
        data_dir = os.path.join(base_dir, "data")
        jobs_emb_path = os.path.join(data_dir, "jobs_embeddings.npy")
        jobs_ids_path = os.path.join(data_dir, "jobs_ids.npy")
        encoder_vocab_path = os.path.join(data_dir, "encoder_vocab.json")
        encoder_emb_path = os.path.join(data_dir, "encoder_embeddings.npy")
        encoder_idf_path = os.path.join(data_dir, "encoder_idf.npy")

        if not os.path.exists(jobs_emb_path):
            raise FileNotFoundError(
                f"Missing precomputed embeddings: {jobs_emb_path}. "
                "Run generate_embeddings.py locally first."
            )
        if not os.path.exists(jobs_ids_path):
            raise FileNotFoundError(
                f"Missing id mapping file: {jobs_ids_path}. "
                "Run generate_embeddings.py locally first."
            )
        if not os.path.exists(encoder_vocab_path) or not os.path.exists(encoder_emb_path):
            raise FileNotFoundError(
                "Missing lightweight encoder artifacts (encoder_vocab.json / encoder_embeddings.npy). "
                "Run generate_embeddings.py locally first."
            )

        self.job_embeddings = np.load(jobs_emb_path).astype(np.float32, copy=False)
        job_ids = np.load(jobs_ids_path, allow_pickle=True)
        self.job_id_to_emb_idx = {str(job_id): idx for idx, job_id in enumerate(job_ids)}

        with open(encoder_vocab_path, "r", encoding="utf-8") as f:
            vocab = json.load(f)
        self.encoder_vocab = {str(k): int(v) for k, v in vocab.items()}
        self.encoder_embeddings = np.load(encoder_emb_path).astype(np.float32, copy=False)
        self.encoder_idf = None
        if os.path.exists(encoder_idf_path):
            self.encoder_idf = np.load(encoder_idf_path).astype(np.float32, copy=False)

        self.dim = int(self.job_embeddings.shape[1])
        self.index = faiss.IndexFlatIP(self.dim)
        self.index.add(self._normalize_rows(self.job_embeddings))

        self.user_profile_vector = None

        self.metrics_path = os.path.join(base_dir, "data", "metrics.csv")

    @staticmethod
    def _normalize_rows(mat: np.ndarray) -> np.ndarray:
        norms = np.linalg.norm(mat, axis=1, keepdims=True) + 1e-9
        return (mat / norms).astype(np.float32, copy=False)

    def clean_text(self, text: str) -> str:
        return text.lower().translate(str.maketrans("", "", string.punctuation)).strip()

    def _tokenize(self, text: str):
        return re.findall(r"[a-z0-9+#.]{2,}", self.clean_text(str(text)))

    def _encode_text_lightweight(self, text: str) -> np.ndarray:
        tokens = self._tokenize(text)
        if not tokens:
            return np.zeros(self.dim, dtype=np.float32)

        vec = np.zeros(self.dim, dtype=np.float32)
        wsum = 0.0
        for tok in tokens:
            idx = self.encoder_vocab.get(tok)
            if idx is None:
                continue
            weight = float(self.encoder_idf[idx]) if self.encoder_idf is not None else 1.0
            vec += self.encoder_embeddings[idx] * weight
            wsum += weight

        if wsum <= 0:
            return np.zeros(self.dim, dtype=np.float32)
        vec /= wsum
        n = float(np.linalg.norm(vec) + 1e-9)
        return (vec / n).astype(np.float32, copy=False)

    def filter_top_jobs(self, resume_text: str, top_n: int = 100):
        """
        Fast prefilter using TF-IDF to keep the top-N candidates before FAISS search.
        Returns (filtered_texts, filtered_df, filtered_embeddings)
        """
        resume_tokens = set(self._tokenize(resume_text))
        if not resume_tokens:
            top_indices = np.arange(min(len(self.jobs_texts), top_n))
            return (
                [self.jobs_texts[i] for i in top_indices],
                self.job_info.iloc[top_indices].reset_index(drop=True),
                self.job_embeddings[top_indices],
            )

        def overlap_score(job_txt: str) -> float:
            jt = set(self._tokenize(job_txt))
            if not jt:
                return 0.0
            inter = len(resume_tokens.intersection(jt))
            union = len(resume_tokens.union(jt))
            return inter / (union + 1e-9)

        similarity_scores = np.array([overlap_score(jt) for jt in self.jobs_texts], dtype=np.float32)
        top_indices = np.argsort(similarity_scores)[-top_n:]
        return (
            [self.jobs_texts[i] for i in top_indices],
            self.job_info.iloc[top_indices].reset_index(drop=True),
            self.job_embeddings[top_indices],
        )

    def load_feedback_embeddings(self, feedback_file: str = None):
        """
        Load ratings and return (embeddings, ratings, merged_df).
        - ratings must be numeric (1..5)
        """
        if feedback_file is None:
            feedback_file = os.path.join(os.path.dirname(__file__), "data", "ratings.csv")

        if not os.path.exists(feedback_file):
            return None, None, None

        df = pd.read_csv(feedback_file)
        if df.empty or "rating" not in df.columns:
            return None, None, None

        df = df[df["rating"].astype(str).str.isnumeric()].copy()
        if df.empty:
            return None, None, None
        df["rating"] = df["rating"].astype(float)

        merged = pd.merge(df, self.job_info, left_on="job_id", right_on="Job Id", how="inner")
        if merged.empty:
            return None, None, None

        emb_indices = [self.job_id_to_emb_idx.get(str(jid)) for jid in merged["job_id"].tolist()]
        valid_rows = [i for i, emb_i in enumerate(emb_indices) if emb_i is not None]
        if not valid_rows:
            return None, None, None
        emb_indices = [emb_indices[i] for i in valid_rows]
        merged = merged.iloc[valid_rows].reset_index(drop=True)
        job_embeds = self.job_embeddings[np.array(emb_indices, dtype=np.int64)]
        ratings = merged["rating"].to_numpy(dtype=np.float32)
        return job_embeds, ratings, merged

    @staticmethod
    def _alpha_from_num_ratings(n_ratings: int) -> float:
        """
        Adaptive blend between resume similarity (alpha) and feedback (1-alpha).
        - Start at alpha≈0.9 with few ratings; decay to 0.5 as ratings grow.
        """
        alpha = 0.9 - 0.04 * n_ratings
        return float(np.clip(alpha, 0.5, 0.9))

    def recommend_jobs(
        self, resume_text: str, top_n: int = 20, use_feedback: bool = True,
        location_weight: float = 0.1, salary_weight: float = 0.1, experience_weight: float = 0.1,
        user_location: str = "", user_salary: str = "", user_experience: str = ""
    ):
        """
        Recommend jobs for a given resume.
        If use_feedback=True and ratings exist, apply feedback-driven re-ranking with:
          - adaptive resume vs feedback blending
          - small skill-overlap boost
        Returns dict with 'recommended_jobs' (list of dict rows).
        """
        resume_text = self.clean_text(resume_text)
        resume_quality = self._calculate_resume_quality(resume_text)

        filtered_texts, filtered_df, filtered_embeds = self.filter_top_jobs(
            resume_text, top_n=max(100, top_n * 3)
        )

        resume_embedding = self._encode_text_lightweight(resume_text).reshape(1, -1)

        index = faiss.IndexFlatIP(self.dim)
        normalized_filtered = self._normalize_rows(filtered_embeds)
        index.add(normalized_filtered)
        distances, indices = index.search(resume_embedding.astype(np.float32), top_n)

        base_sims = distances[0]
        sims_norm = (base_sims - base_sims.min()) / (base_sims.max() - base_sims.min() + 1e-9)

        recs = filtered_df.iloc[indices[0]].copy()
        recs["similarity"] = sims_norm

        resume_words = set(resume_text.split())
        recs["matched_skills"] = recs["requisite_skill"].apply(
            lambda x: ", ".join(list(resume_words.intersection(set(str(x).split())))[:8])
        )
        recs["skill_overlap"] = recs["matched_skills"].apply(
            lambda s: 0 if pd.isna(s) or str(s).strip() == "" else len([t for t in str(s).split(",") if t.strip()])
        )

        if not use_feedback:
            recs["adjusted_score"] = recs["similarity"]
            return {"recommended_jobs": recs.to_dict(orient="records"), "resume_quality": resume_quality}

        rated_embeds, ratings, _ = self.load_feedback_embeddings()
        if rated_embeds is None:
            recs["adjusted_score"] = recs["similarity"]
            return {"recommended_jobs": recs.to_dict(orient="records"), "resume_quality": resume_quality}

        norm_r = (ratings - ratings.min()) / (ratings.max() - ratings.min() + 1e-9)
        user_vec = np.average(rated_embeds, axis=0, weights=norm_r).astype(np.float32)
        user_vec = user_vec / (np.linalg.norm(user_vec) + 1e-9)
        self.user_profile_vector = user_vec

        filtered_sel = normalized_filtered[indices[0]]
        up_sim = np.dot(filtered_sel, user_vec) / (
            np.linalg.norm(filtered_sel, axis=1) * np.linalg.norm(user_vec) + 1e-9
        )

        alpha = self._alpha_from_num_ratings(len(ratings))
        beta = 1.0 - alpha

        skill_boost = 0.02 * np.minimum(recs["skill_overlap"].to_numpy(dtype=float), 5.0)

        recs["location_score"] = recs["workplace"].apply(lambda x: self._calculate_location_score(x, user_location))
        recs["salary_score"] = recs["salary"].apply(lambda x: self._calculate_salary_score(x, user_salary))
        recs["experience_score"] = recs["requisite_skill"].apply(lambda x: self._calculate_experience_score(x, user_experience))

        try:
            recs["adjusted_score"] = (
                alpha * recs["similarity"] +
                beta * up_sim +
                skill_boost +
                location_weight * recs["location_score"] +
                salary_weight * recs["salary_score"] +
                experience_weight * recs["experience_score"]
            )
            recs = recs.sort_values(by="adjusted_score", ascending=False)
        except KeyError:
            return {"recommended_jobs": [], "resume_quality": resume_quality}
        return {"recommended_jobs": recs.to_dict(orient="records"), "resume_quality": resume_quality}

    def _calculate_resume_quality(self, resume_text: str) -> float:
        """
        Calculate a resume quality score based on heuristics.
        - Text length (rewards detail)
        - Keyword diversity (rewards richness)
        Returns a score in [0, 1].
        """
        clean_text = self.clean_text(resume_text)
        words = clean_text.split()

        word_count = len(words)
        if word_count < 150:
            length_score = 0.2
        elif word_count <= 250:
            length_score = 0.5
        elif word_count <= 750:
            length_score = 1.0
        else:
            length_score = 0.7

        keywords = {
            "experience", "education", "skills", "projects",
            "summary", "objective", "achievements", "contact",
            "linkedin", "github"
        }
        found_keywords = sum(1 for keyword in keywords if keyword in clean_text)
        diversity_score = min(found_keywords / 6.0, 1.0)

        num_count = sum(1 for word in words if word.isdigit())
        metrics_score = min(num_count / 5.0, 1.0)

        final_score = (0.4 * length_score) + (0.4 * diversity_score) + (0.2 * metrics_score)
        return round(final_score, 2)

    def _calculate_location_score(self, job_location: str, user_location: str) -> float:
        """
        Calculate a location score based on string matching.
        - 1.0 if the user's location is a substring of the job's location (case-insensitive).
        - 0.0 otherwise.
        """
        if not user_location or pd.isna(job_location):
            return 0.0
        return 1.0 if user_location.lower() in str(job_location).lower() else 0.0

    def _calculate_salary_score(self, job_salary: str, user_salary: str) -> float:
        """
        Calculate a salary score.
        - Parses job salary (handles ranges and "Up to X" formats).
        - Compares the max potential salary to the user's desired salary.
        - Returns a score in [0, 1] based on how well it meets or exceeds the desire.
        """
        if pd.isna(job_salary) or not user_salary.isdigit():
            return 0.0

        user_s = int(user_salary)
        job_s_str = str(job_salary).lower().replace(",", "").replace("$", "")

        max_salary = 0
        if "up to" in job_s_str:
            parts = job_s_str.split("up to")
            if len(parts) > 1 and parts[1].strip().isdigit():
                max_salary = int(parts[1].strip())
        elif "-" in job_s_str:
            parts = job_s_str.split("-")
            if len(parts) > 1 and parts[1].strip().isdigit():
                max_salary = int(parts[1].strip())
        elif job_s_str.strip().isdigit():
            max_salary = int(job_s_str.strip())

        if max_salary == 0:
            return 0.0

        score = min(max_salary / user_s, 1.0)
        return score

    def _calculate_experience_score(self, job_experience: str, user_experience: str) -> float:
        """
        Calculate an experience score.
        - Extracts required years of experience from job text (e.g., "5+ years").
        - Compares required experience to user's stated experience.
        - Returns 1.0 if user meets or exceeds, 0.5 if slightly under, 0.0 otherwise.
        """
        if pd.isna(job_experience) or not user_experience.isdigit():
            return 0.0

        user_exp = int(user_experience)
        job_exp_str = str(job_experience).lower()

        import re
        found_nums = re.findall(r'(\d+)\+?\s*years', job_exp_str)
        if not found_nums:
            return 0.2

        required_exp = max([int(n) for n in found_nums])

        if user_exp >= required_exp:
            return 1.0
        elif user_exp >= required_exp - 2:
            return 0.5
        else:
            return 0.0

    def retrain_with_feedback(self, resume_text: str, top_n: int = 20):
        """
        Compare old vs enhanced results and compute metrics:
          - NDCG@K (k=top_n) between old (similarity) and new (adjusted_score)
          - Spearman-R between old & new scores for matched rows
          - Reordered % (how many items changed position among common ids)
        Returns dict with lists and metrics, and logs metrics to data/metrics.csv.
        """
        old_results = self.recommend_jobs(resume_text, top_n=top_n, use_feedback=False)
        old = pd.DataFrame(old_results["recommended_jobs"])
        new_results = self.recommend_jobs(resume_text, top_n=top_n, use_feedback=True)
        new = pd.DataFrame(new_results["recommended_jobs"])

        comp = old[["Job Id", "position", "similarity"]].merge(
            new[["Job Id", "adjusted_score"]], on="Job Id", how="outer"
        )

        y_true = comp["similarity"].fillna(0).to_numpy()
        y_score = comp["adjusted_score"].fillna(0).to_numpy()

        ndcg = self._ndcg_at_k(y_true, y_score, k=top_n)

        spear = _spearman_r(y_true, y_score)

        old_order = {jid: i for i, jid in enumerate(old["Job Id"].tolist())}
        new_order = {jid: i for i, jid in enumerate(new["Job Id"].tolist())}
        common_ids = [jid for jid in old_order if jid in new_order]
        moved = sum(1 for jid in common_ids if old_order[jid] != new_order[jid])
        reordered_pct = (moved / max(1, len(common_ids))) * 100.0

        _ensure_data_dir(self.metrics_path)
        log_row = pd.DataFrame([{
            "timestamp": pd.Timestamp.now().isoformat(),
            "ndcg_at_k": round(ndcg, 4),
            "spearman_r": round(float(spear), 4),
            "reordered_pct": round(reordered_pct, 2),
            "k": top_n,
            "resume_quality": new_results.get("resume_quality", 0.0),
            "avg_location_score": new["location_score"].mean(),
            "avg_salary_score": new["salary_score"].mean(),
            "avg_experience_score": new["experience_score"].mean(),
        }])
        if os.path.exists(self.metrics_path):
            log_row.to_csv(self.metrics_path, mode="a", header=False, index=False)
        else:
            log_row.to_csv(self.metrics_path, mode="w", header=True, index=False)

        return {
            "old_jobs": old.to_dict(orient="records"),
            "new_jobs": new.to_dict(orient="records"),
            "comparison": comp,
            "metrics": {
                "ndcg_at_k": round(ndcg, 3),
                "spearman_r": round(float(spear), 3),
                "reordered_pct": round(reordered_pct, 1),
            },
        }

    @staticmethod
    def _dcg(scores: np.ndarray, k: int) -> float:
        k = min(k, scores.size)
        if k <= 0:
            return 0.0
        gains = scores[:k]
        discounts = 1.0 / np.log2(np.arange(2, k + 2))
        return float(np.sum(gains * discounts))

    @classmethod
    def _ndcg_at_k(cls, y_true: np.ndarray, y_score: np.ndarray, k: int) -> float:
        if y_true.size == 0 or y_score.size == 0:
            return 0.0
        order = np.argsort(y_score)[::-1]
        ideal = np.argsort(y_true)[::-1]
        dcg = cls._dcg(y_true[order], k)
        idcg = cls._dcg(y_true[ideal], k)
        if idcg <= 0:
            return 0.0
        return dcg / idcg

    def get_metrics_history(self):
        """Return metrics history DataFrame if available."""
        full_schema = [
            "timestamp", "ndcg_at_k", "spearman_r", "reordered_pct", "k",
            "resume_quality", "avg_location_score", "avg_salary_score", "avg_experience_score"
        ]
        if not os.path.exists(self.metrics_path):
            return pd.DataFrame(columns=full_schema)
        try:
            df = pd.read_csv(self.metrics_path, header=None)
            num_cols = len(df.columns)
            df.columns = full_schema[:num_cols]
            for col in full_schema:
                if col not in df.columns:
                    df[col] = pd.NA
            return df[full_schema]
        except (pd.errors.ParserError, pd.errors.EmptyDataError):
            return pd.DataFrame(columns=full_schema)
