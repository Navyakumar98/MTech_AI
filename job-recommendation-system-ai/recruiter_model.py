import os
import re
import string
import numpy as np
import pandas as pd
import faiss
from sentence_transformers import SentenceTransformer
from sklearn.metrics import ndcg_score
from scipy.stats import spearmanr  

_model=None

def get_model():
    global _model
    if _model is None:
        _model=SentenceTransformer("paraphrase-MiniLM-L6-v2",device="cpu")
    return _model


class RecruiterRankingSystem:

    def __init__(self,resumes_csv):

        self.model=get_model()

        self.resumes_df=pd.read_csv(resumes_csv)

        self.resume_texts=self.resumes_df["resume_text"].astype(str).tolist()

        emb=self.model.encode(self.resume_texts,convert_to_numpy=True).astype(np.float32)

        emb=emb/(np.linalg.norm(emb,axis=1,keepdims=True)+1e-9)

        self.resume_embeddings=emb

        self.index=faiss.IndexFlatIP(emb.shape[1])

        self.index.add(emb)

        self.metrics_path="data/recruiter_metrics.csv"
        self.ratings_path="data/recruiter_ratings.csv"

        self.user_profile_vector = None


    def clean_text(self,text):

        text=text.lower()

        text=text.translate(str.maketrans("","",string.punctuation))

        return re.sub(r"\s+"," ",text)


    def extract_skills(self,text):

        skills={"python","java","aws","docker","react","sql","machine learning","nlp","kubernetes"}

        return {s for s in skills if s in text}


    def extract_experience_years(self,text):

        m=re.findall(r"(\d+)\s*\+?\s*years?",text)

        return max(map(int,m)) if m else 0


    def load_feedback_embeddings(self, jd_id):
        if not os.path.exists(self.ratings_path):
            return None, None, None

        df = pd.read_csv(self.ratings_path)
        if df.empty or "rating" not in df.columns:
            return None, None, None

        df = df[df["rating"].astype(str).str.isnumeric()].copy()
        if df.empty:
            return None, None, None
        df["rating"] = df["rating"].astype(float)

        # Filter for current JD if jd_id is provided
        if jd_id is not None:
            df = df[df["jd_id"].astype(str) == str(jd_id)]

        if df.empty:
            return None, None, None

        # Join with resume info
        df["candidate_id"] = df["candidate_id"].astype(str)
        resumes = self.resumes_df.copy()
        resumes["candidate_id"] = resumes["candidate_id"].astype(str)
        merged = pd.merge(df, resumes, on="candidate_id", how="inner")
        if merged.empty:
            return None, None, None

        cand_embeds = self.model.encode(merged["resume_text"].tolist(), convert_to_numpy=True).astype(np.float32)
        ratings = merged["rating"].to_numpy(dtype=np.float32)
        return cand_embeds, ratings, merged

    @staticmethod
    def _alpha_from_num_ratings(n_ratings: int) -> float:
        alpha = 0.9 - 0.04 * n_ratings
        return float(np.clip(alpha, 0.5, 0.9))

    def rank_candidates(self,job_description,top_k=20,min_experience=0,max_salary=None,use_feedback=False,jd_id=None):

        jd=self.clean_text(job_description)

        jd_emb=self.model.encode([jd],convert_to_numpy=True).astype(np.float32)

        jd_emb=jd_emb/(np.linalg.norm(jd_emb)+1e-9)

        dist,idx=self.index.search(jd_emb,len(self.resume_texts))

        jd_skills=self.extract_skills(jd)

        jd_exp=self.extract_experience_years(jd)

        results=[]

        for i,id_ in enumerate(idx[0]):

            cand=self.resumes_df.iloc[id_]

            semantic=float(dist[0][i])

            skills=set(str(cand["skills"]).lower().split(";"))

            match=jd_skills.intersection(skills)

            skill_score=len(match)/len(jd_skills) if jd_skills else 1

            exp=float(cand["experience"])

            if exp<min_experience:
                continue

            # Default to high max salary if not provided
            if max_salary is not None and max_salary > 0:
                salary = float(cand.get("salary", 0))
                if salary > max_salary:
                    continue

            exp_score=min(exp/jd_exp,1) if jd_exp else 1

            final=(0.5*semantic)+(0.3*skill_score)+(0.2*exp_score)

            results.append({
                "base_score": final,

                "candidate_id":str(cand["candidate_id"]),

                "name": str(cand.get("name", "Unknown")),
                "phone": str(cand.get("phone", "Unknown")),
                "email": str(cand.get("email", "Unknown")),

                "final_score":round(final,4),

                # "semantic_score":round(semantic,4),

                # "skill_score":round(skill_score,4),

                # "experience_score":round(exp_score,4),

                # "matched_skills":list(match),

                "experience":exp,
                "salary": float(cand.get("salary", 0)),
                "resume_summary":cand["resume_text"][:200]+"..."
            })

        # Apply feedback if requested
        if use_feedback:
            rated_embeds, ratings, _ = self.load_feedback_embeddings(jd_id)
            if rated_embeds is not None and len(ratings) > 0:
                # We simply normalize ratings. It is ok if min is 0 or all ratings are the same.
                r_min = ratings.min()
                r_max = ratings.max()
                if r_max == r_min:
                    norm_r = np.ones_like(ratings, dtype=np.float32) / len(ratings)
                else:
                    norm_r = (ratings - r_min) / (r_max - r_min)
                    # normalize sum
                    norm_sum = norm_r.sum()
                    if norm_sum > 0:
                        norm_r = norm_r / norm_sum
                    else:
                        norm_r = np.ones_like(ratings, dtype=np.float32) / len(ratings)

                try:
                    # just use sum of arrays avoiding numpy weights param completely
                    norm_r_expanded = np.expand_dims(norm_r, axis=1)
                    weighted_sum = np.sum(rated_embeds * norm_r_expanded, axis=0)
                    user_vec = (weighted_sum / np.sum(norm_r)).astype(np.float32)
                except Exception:
                    user_vec = np.mean(rated_embeds, axis=0).astype(np.float32)

                self.user_profile_vector = user_vec

                alpha = self._alpha_from_num_ratings(len(ratings))
                beta = 1.0 - alpha

                for r in results:
                    cid = str(r["candidate_id"])
                    idx_in_df = self.resumes_df.index[self.resumes_df["candidate_id"].astype(str) == cid].tolist()
                    if idx_in_df:
                        cand_emb = self.resume_embeddings[idx_in_df[0]]
                        up_sim = float(np.dot(cand_emb, user_vec) / (np.linalg.norm(cand_emb) * np.linalg.norm(user_vec) + 1e-9))
                        r["final_score"] = alpha * r["base_score"] + beta * up_sim
                    else:
                        r["final_score"] = r["base_score"]
            else:
                 for r in results:
                     r["final_score"] = r["base_score"]
        else:
            for r in results:
                r["final_score"] = r["base_score"]

        results=sorted(results,key=lambda x:x["final_score"],reverse=True)

        # Generate relevance and calculate metrics
        relevance_labels = []
        all_scores = []

        # We need scores for all resumes to calculate NDCG and Precision accurately against the whole dataset
        candidate_scores = {r['candidate_id']: r['final_score'] for r in results}

        for _, row in self.resumes_df.iterrows():
            cid = str(row['candidate_id'])

            # Synthetic relevance label based on skills and exp match
            # (as the actual 'relevance' might need human annotation)
            # A candidate is considered relevant if they meet the minimum experience and share at least one skill.

            # For a more nuanced relevance, we could say relevant if final_score > threshold,
            # but let's base it on extracted JD skills and exp.
            skills = set(str(row["skills"]).lower().split(";"))
            match = jd_skills.intersection(skills)
            exp = float(row["experience"])

            is_relevant = 1 if (len(match) > 0 and exp >= min_experience) else 0

            relevance_labels.append(is_relevant)
            all_scores.append(candidate_scores.get(cid, 0.0))

        all_scores = np.nan_to_num(all_scores)

        # Calculate metrics using the top_k value
        p_k, ndcg_k = self.compute_metrics(relevance_labels, all_scores, k=top_k)

        metrics = {"Precision@K": round(p_k, 4), "NDCG@K": round(ndcg_k, 4)}

        # Log metrics to history
        log_row = pd.DataFrame([{
            "timestamp": pd.Timestamp.now().isoformat(),
            "Precision@K": round(p_k, 4),
            "NDCG@K": round(ndcg_k, 4),
            "k": top_k
        }])
        if not os.path.exists(os.path.dirname(self.metrics_path)):
            os.makedirs(os.path.dirname(self.metrics_path), exist_ok=True)

        if os.path.exists(self.metrics_path):
            log_row.to_csv(self.metrics_path, mode="a", header=False, index=False)
        else:
            log_row.to_csv(self.metrics_path, mode="w", header=True, index=False)

        # Return results with metrics
        return results[:top_k], metrics


    def get_metrics_history(self):
        """Return metrics history DataFrame if available."""
        full_schema = ["timestamp", "Precision@K", "NDCG@K", "k"]
        if not os.path.exists(self.metrics_path):
            return pd.DataFrame(columns=full_schema)
        try:
            df = pd.read_csv(self.metrics_path)
            # Ensure all required columns exist, add them with NA if missing
            for col in full_schema:
                if col not in df.columns:
                    df[col] = pd.NA
            return df[full_schema]
        except (pd.errors.ParserError, pd.errors.EmptyDataError):
            return pd.DataFrame(columns=full_schema)

    def compute_metrics(self, relevance_labels, predicted_scores, k=10):
        relevance_labels = np.array(relevance_labels)
        predicted_scores = np.array(predicted_scores)
        indices = np.argsort(predicted_scores)[::-1]
        top_k_relevance = relevance_labels[indices[:k]]
        precision_at_k = np.sum(top_k_relevance) / k
        try:
            ndcg_at_k = float(ndcg_score([relevance_labels], [predicted_scores], k=k))
        except ValueError:
            ndcg_at_k = 0.0
        return precision_at_k, ndcg_at_k


    def retrain_with_feedback(self, job_description, jd_id, top_k=20, min_experience=0, max_salary=None):

        # -------- BEFORE --------
        old, _ = self.rank_candidates(
            job_description, top_k, min_experience, max_salary=max_salary,
            use_feedback=False, jd_id=jd_id
        )

        # -------- AFTER --------
        new, _ = self.rank_candidates(
            job_description, top_k, min_experience, max_salary=max_salary,
            use_feedback=True, jd_id=jd_id
        )

        old_df = pd.DataFrame(old)
        new_df = pd.DataFrame(new)

        # -------- CLEAN MERGE (NO _old/_new MESS) --------

        # Rename scores
        old_df = old_df.rename(columns={"final_score": "final_score_old"})
        new_df = new_df.rename(columns={"final_score": "final_score_new"})

        # Keep only required columns from new_df
        new_df_clean = new_df[["candidate_id", "final_score_new"]]

        # Merge
        comp = old_df.merge(new_df_clean, on="candidate_id")

        # -------- TRUE RELEVANCE --------
        jd = self.clean_text(job_description)
        jd_skills = self.extract_skills(jd)

        relevance = []
        old_scores = []
        new_scores = []

        for _, row in comp.iterrows():

            cid = str(row["candidate_id"])

            resume_row = self.resumes_df[
                self.resumes_df["candidate_id"].astype(str) == cid
            ]

            if resume_row.empty:
                continue

            resume_row = resume_row.iloc[0]

            skills = set(str(resume_row["skills"]).lower().split(";"))
            exp = float(resume_row["experience"])

            is_relevant = 1 if (len(jd_skills.intersection(skills)) > 0 and exp >= min_experience and (max_salary is None or max_salary == 0 or float(resume_row.get("salary", 0)) <= max_salary)) else 0

            relevance.append(is_relevant)
            old_scores.append(row["final_score_old"])
            new_scores.append(row["final_score_new"])

        relevance = np.array(relevance)
        old_scores = np.array(old_scores)
        new_scores = np.array(new_scores)

        # -------- METRICS --------
        if len(relevance) < 2:
            ndcg_before = 0.0
            ndcg_after = 0.0
            spear = 0.0
        else:
            ndcg_before = float(ndcg_score([relevance], [old_scores]))
            ndcg_after = float(ndcg_score([relevance], [new_scores]))

            spear, _ = spearmanr(old_scores, new_scores)
            if np.isnan(spear):
                spear = 0.0

        ndcg_improvement = ndcg_after - ndcg_before

        # -------- REORDER --------
        old_order = {str(c["candidate_id"]): i for i, c in enumerate(old)}
        new_order = {str(c["candidate_id"]): i for i, c in enumerate(new)}

        common_ids = [cid for cid in old_order if cid in new_order]

        moved = sum(1 for cid in common_ids if old_order[cid] != new_order[cid])
        reordered_pct = (moved / max(1, len(common_ids))) * 100.0

        return {
            "old_candidates": old,
            "new_candidates": new,
            "comparison": comp,
            "metrics": {
                "ndcg_before": round(ndcg_before, 3),
                "ndcg_after": round(ndcg_after, 3),
                "ndcg_improvement": round(ndcg_improvement, 3),
                "spearman_r": round(float(spear), 3),
                "reordered_pct": round(reordered_pct, 1),
                "k": top_k
            }
        }