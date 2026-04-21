# Complete Process Flow: Job Recommendation & AI Enhanced Recruiter System

The following represents the complete end-to-end process flow for the platform, incorporating both the core recommendation/ranking engine and the newer AI Feedback loop for recruiters.

## 1. Job Description Input
- The recruiter inputs a Job Description (JD), either by pasting text directly into the dashboard or by uploading a PDF document.
- The text is extracted and preprocessed for analysis.

## 2. Resume Collection and Parsing
- The system collects candidates' resumes (e.g., from a CSV database).
- Information such as skills, experience, and contact details are parsed. Text from PDF resumes can also be extracted using tools like `PyMuPDF`.

## 3. Text Preprocessing
- Both the Job Description and the resume texts are cleaned.
- Text is converted to lowercase, punctuation is removed, and multiple spaces are reduced to a single space.
- Specific skills and years of experience are extracted using regular expressions and keyword matching.

## 4. Embedding Generation
- The cleaned text is passed through an NLP model (e.g., `SentenceTransformers` using `paraphrase-MiniLM-L6-v2`) to generate dense vector embeddings.
- These embeddings capture the semantic meaning of the job description and the resumes.
- Vectors are L2 normalized to ensure cosine similarity can be calculated efficiently via inner product.

## 5. Vector Indexing using FAISS
- The resume embeddings are loaded into a `FAISS` (Facebook AI Similarity Search) index.
- Specifically, `IndexFlatIP` is used for inner product search, which computes cosine similarity since the vectors are normalized.

## 6. Similarity Search
- The system queries the FAISS index using the Job Description embedding.
- It quickly retrieves the top candidates based on the semantic similarity distance between the JD and resume vectors.

## 7. Hybrid Scoring Calculation
- A base score is calculated for each candidate using a weighted combination of factors:
  - **Semantic Score (50%)**: Derived directly from the FAISS similarity search.
  - **Skill Match Score (30%)**: The intersection of skills required in the JD and the skills present in the resume.
  - **Experience Score (20%)**: Comparing the candidate's years of experience against the minimum required by the JD.
- Additional filtering is applied at this stage, such as minimum experience threshold or maximum salary limits.

## 8. Candidate Ranking
- Candidates are sorted based on their final hybrid score in descending order.
- The top *K* candidates are selected and displayed on the recruiter dashboard with metrics.

## 9. Recruiter Feedback Collection
- Recruiters review the top-ranked candidates and provide a 1-5 star rating based on relevance.
- This feedback is logged and associated with the specific candidate and Job Description ID.

## 10. AI Feedback Integration (Retraining/Reranking)
- When the recruiter selects "Enhance with AI Feedback", the system retrieves the historical ratings for the current JD.
- Candidate embeddings are weighted based on the normalized ratings to compute an "Ideal Candidate Profile" vector.
- The system then calculates an **User Profile Similarity** score between each candidate and this new Ideal Profile vector.
- A new final score is calculated using an exponential moving average (or weighted sum), blending the original hybrid base score with the new User Profile Similarity score (adjusted by a feedback weight coefficient, alpha).

## 11. Enhanced Candidate Ranking & Metrics Review
- The system re-sorts the candidates based on this new feedback-adjusted score.
- An enhanced dashboard is presented to the recruiter showing:
  - The newly ordered list of candidates.
  - A side-by-side comparison of the old vs. new rankings.
  - Metrics quantifying the improvement, such as changes in NDCG (Normalized Discounted Cumulative Gain), Spearman's Rank Correlation Coefficient, and the percentage of reordered candidates.
