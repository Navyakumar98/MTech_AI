import argparse
import json
import os
import re
from collections import Counter, defaultdict

import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer


def _normalize_rows(mat: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(mat, axis=1, keepdims=True) + 1e-9
    return (mat / norms).astype(np.float32, copy=False)


def _clean_text(text: str) -> str:
    return str(text).lower().strip()


def _tokenize(text: str):
    return re.findall(r"[a-z0-9+#.]{2,}", _clean_text(text))


def _build_job_text(df: pd.DataFrame) -> pd.Series:
    return (
        df["workplace"].astype(str) + " "
        + df["working_mode"].astype(str) + " "
        + df["position"].astype(str) + " "
        + df["job_role_and_duties"].astype(str) + " "
        + df["requisite_skill"].astype(str)
    )


def _build_token_encoder(texts, embeddings, max_vocab=50000, min_df=2):
    doc_freq = Counter()
    token_to_sum = defaultdict(lambda: np.zeros(embeddings.shape[1], dtype=np.float64))
    token_to_count = Counter()

    for i, text in enumerate(texts):
        toks = _tokenize(text)
        if not toks:
            continue
        unique_toks = set(toks)
        for tok in unique_toks:
            doc_freq[tok] += 1

        emb = embeddings[i].astype(np.float64, copy=False)
        for tok in toks:
            token_to_sum[tok] += emb
            token_to_count[tok] += 1

    # Keep stable / useful vocab
    kept = [t for t, c in doc_freq.items() if c >= min_df]
    kept.sort(key=lambda t: doc_freq[t], reverse=True)
    kept = kept[:max_vocab]

    vocab = {tok: idx for idx, tok in enumerate(kept)}
    token_embeddings = np.zeros((len(kept), embeddings.shape[1]), dtype=np.float32)
    idf = np.zeros(len(kept), dtype=np.float32)
    n_docs = max(1, len(texts))

    for tok, idx in vocab.items():
        token_embeddings[idx] = (token_to_sum[tok] / max(1, token_to_count[tok])).astype(np.float32)
        idf[idx] = np.log((n_docs + 1) / (doc_freq[tok] + 1)) + 1.0

    token_embeddings = _normalize_rows(token_embeddings)
    return vocab, token_embeddings, idf


def main():
    parser = argparse.ArgumentParser(description="Generate offline embeddings for low-memory runtime.")
    parser.add_argument("--jobs-csv", default="JobsFE.csv", help="Path to Jobs CSV.")
    parser.add_argument("--resumes-csv", default=os.path.join("data", "resumes.csv"), help="Path to resumes CSV.")
    parser.add_argument("--out-dir", default="data", help="Output directory for .npy/.json artifacts.")
    parser.add_argument("--model-name", default="paraphrase-MiniLM-L6-v2", help="SentenceTransformer model.")
    args = parser.parse_args()

    base_dir = os.path.dirname(__file__)
    jobs_csv_path = os.path.join(base_dir, args.jobs_csv) if not os.path.isabs(args.jobs_csv) else args.jobs_csv
    resumes_csv_path = (
        os.path.join(base_dir, args.resumes_csv) if not os.path.isabs(args.resumes_csv) else args.resumes_csv
    )
    out_dir = os.path.join(base_dir, args.out_dir) if not os.path.isabs(args.out_dir) else args.out_dir
    os.makedirs(out_dir, exist_ok=True)

    if not os.path.exists(jobs_csv_path):
        raise FileNotFoundError(f"Jobs CSV not found: {jobs_csv_path}")
    if not os.path.exists(resumes_csv_path):
        raise FileNotFoundError(f"Resumes CSV not found: {resumes_csv_path}")

    jobs_df = pd.read_csv(jobs_csv_path)
    resumes_df = pd.read_csv(resumes_csv_path, encoding="utf-8", quotechar='"', skipinitialspace=True)
    resumes_df.columns = resumes_df.columns.str.strip()

    required_job_cols = ["Job Id", "workplace", "working_mode", "position", "job_role_and_duties", "requisite_skill"]
    missing_job_cols = [c for c in required_job_cols if c not in jobs_df.columns]
    if missing_job_cols:
        raise ValueError(f"Missing columns in jobs CSV: {missing_job_cols}")
    if "resume_text" not in resumes_df.columns:
        raise ValueError("resumes.csv must contain 'resume_text'")
    if "candidate_id" not in resumes_df.columns:
        raise ValueError("resumes.csv must contain 'candidate_id'")

    jobs_text = _build_job_text(jobs_df).fillna("").astype(str).tolist()
    resume_text = resumes_df["resume_text"].fillna("").astype(str).tolist()

    model = SentenceTransformer(args.model_name, device="cpu")

    jobs_embeddings = model.encode(jobs_text, convert_to_numpy=True, show_progress_bar=True).astype(np.float32)
    resumes_embeddings = model.encode(resume_text, convert_to_numpy=True, show_progress_bar=True).astype(np.float32)

    # Persist normalized vectors to match runtime FAISS IP search.
    jobs_embeddings = _normalize_rows(jobs_embeddings)
    resumes_embeddings = _normalize_rows(resumes_embeddings)

    np.save(os.path.join(out_dir, "jobs_embeddings.npy"), jobs_embeddings)
    np.save(os.path.join(out_dir, "resumes_embeddings.npy"), resumes_embeddings)
    np.save(os.path.join(out_dir, "jobs_ids.npy"), jobs_df["Job Id"].astype(str).to_numpy())
    np.save(os.path.join(out_dir, "resumes_ids.npy"), resumes_df["candidate_id"].astype(str).to_numpy())

    encoder_texts = jobs_text + resume_text
    encoder_embeds = np.vstack([jobs_embeddings, resumes_embeddings]).astype(np.float32)
    vocab, token_embeddings, idf = _build_token_encoder(encoder_texts, encoder_embeds)

    with open(os.path.join(out_dir, "encoder_vocab.json"), "w", encoding="utf-8") as f:
        json.dump(vocab, f, ensure_ascii=True)
    np.save(os.path.join(out_dir, "encoder_embeddings.npy"), token_embeddings)
    np.save(os.path.join(out_dir, "encoder_idf.npy"), idf)

    print("Saved artifacts to:", out_dir)
    print("- jobs_embeddings.npy")
    print("- resumes_embeddings.npy")
    print("- jobs_ids.npy")
    print("- resumes_ids.npy")
    print("- encoder_vocab.json")
    print("- encoder_embeddings.npy")
    print("- encoder_idf.npy")


if __name__ == "__main__":
    main()
