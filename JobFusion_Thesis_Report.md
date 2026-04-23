# JOBFUSION THESIS REPORT
**Project:** JobFusion - AI-Driven Recruitment Intelligence Platform

---

## Technical Understanding Report 


### Project Purpose (Implemented)

JobFusion is a dual-workspace recruitment platform with:

- **Jobseeker side:** Upload resume PDF, extract text, get ranked job recommendations, rate jobs, and trigger feedback-based re-ranking.
- **Recruiter side:** Paste/upload job description (JD), rank candidates from resume dataset, rate candidates, and trigger feedback-based re-ranking.
- **Evaluation layer:** Logs ranking quality metrics (NDCG, Spearman, reorder %) for jobseeker flow and Precision\@K / NDCG\@K for recruiter flow.

It is a semantic retrieval + heuristic scoring system with optional personalization via explicit ratings.

### Folder Structure (Actual)

- `frontend/`
  - React app (`react-scripts`) with role-based routing
  - Major components: `AuthFormNew`, `JobseekerModule`, `RecruiterModule`, `Home`, `About`, `Header`
  - Firebase auth + Firestore user profile
- `backend/`
  - Flask app (`app.py`) + API blueprint (`api_blueprint.py`)
  - AI modules:
    - `ai_model.py` (job recommendation pipeline)
    - `ai_recruiter_model.py` (candidate ranking pipeline)
  - `data/`
    - `resumes.csv` (candidate pool)
    - `ratings.csv`, `recruiter_ratings.csv` (feedback)
    - `metrics.csv`, `recruiter_metrics.csv` (evaluation logs)

### Frontend Modules

- `frontend/src/App.jsx`:
  - Watches Firebase auth state
  - Reads role from localStorage/Firestore
  - Route protection:
    - `/jobseeker`: `jobSeeker` or `admin`
    - `/recruiter`: `recruiter` or `admin`
    - `/select-role`: `admin`
- `frontend/src/components/AuthFormNew.jsx`:
  - Firebase email/password login/signup
  - Stores user in Firestore `users/{uid}`
  - Redirects by role
- `frontend/src/components/JobseekerModule.jsx`:
  - Resume upload -> `/api/jobseeker/extract`
  - Recommendation -> `/api/jobseeker/recommend`
  - Rating -> `/api/jobseeker/rate`
  - Enhancement -> `/api/jobseeker/enhance`
- `frontend/src/components/RecruiterModule.jsx`:
  - JD input/upload
  - Ranking -> `/api/recruiter/rank`
  - Rating -> `/api/recruiter/rate`
  - Enhancement -> `/api/recruiter/enhance`
  - CSV export support

### Backend Modules

- `backend/app.py`: Flask + CORS + blueprint registration under `/api`
- `backend/api_blueprint.py`:
  - Lazy initialization of recommender/ranker
  - PDF extraction via PyMuPDF (`fitz`)
  - CSV rating persistence
  - Candidate field extraction with regex
- `backend/ai_model.py`:
  - Sentence embeddings (`paraphrase-MiniLM-L6-v2`)
  - TF-IDF prefilter -> FAISS ranking
  - Feedback personalization with adaptive blending
  - Metric logging to `data/metrics.csv`
- `backend/ai_recruiter_model.py`:
  - Resume embeddings + FAISS index
  - Hybrid score = semantic + skill + experience
  - Feedback-aware reweighting
  - Metrics in `data/recruiter_metrics.csv`

### Algorithms and Evaluation

- Sentence-Transformer: `paraphrase-MiniLM-L6-v2`
- FAISS: `IndexFlatIP`
- TF-IDF prefilter (`TfidfVectorizer`)
- Adaptive blending:
  - `alpha = clip(0.9 - 0.04*N_ratings, 0.5, 0.9)`
- Jobseeker adjusted score:
  - resume similarity + user similarity + capped skill boost + weighted location/salary/experience
- Recruiter score:
  - `0.5 * semantic + 0.3 * skill + 0.2 * experience`
- Metrics:
  - NDCG, Spearman correlation, Precision\@K, reordered percentage

### Thesis Accuracy Notes

- Backend is **Flask** (not FastAPI)
- Firebase is used for auth/profile; core ranking persistence is CSV-based
- Cover letter/DOCX/PDF generation workflows are not fully present in current backend branch and should be marked as future scope unless sourced from another branch/version

---

## Chapter 1: Introduction

### 1.1 Background

The recruitment domain has evolved from manual filtering to ATS, job boards, and intelligent recommendation platforms. However, keyword-heavy systems still fail in semantic matching scenarios where equivalent skills are written differently (e.g., "Spring Boot microservices" vs "Java backend APIs"). Both job seekers and recruiters face efficiency and relevance challenges, motivating an IR-style ranking-based system.

JobFusion is designed as a two-sided AI recruitment platform combining semantic retrieval, heuristic scoring, and feedback-driven re-ranking.

### 1.2 Problem Statement

Key limitations in existing systems:

- Keyword dependency
- Fragmented jobseeker/recruiter workflows
- Weak personalization
- Limited interpretability
- Inadequate ranking-quality evaluation

**Problem addressed:** Build a unified recruitment platform that semantically matches resumes/jobs (and JD/candidates), applies interpretable hybrid scoring, supports feedback re-ranking, and evaluates with standard IR metrics.

### 1.3 Need for the System

- Conventional keyword matching is insufficient for semantic equivalence
- Recruiters need ranking intelligence under practical constraints
- Jobseekers need actionable, personalized role-fit guidance
- Two-sided consistency improves explainability and maintainability

### 1.4 Objectives

1. Develop role-specific full-stack recruitment platform  
2. Implement semantic retrieval with embeddings + vector search  
3. Design interpretable hybrid scoring  
4. Enable feedback-aware re-ranking for both modules  
5. Evaluate with NDCG, Spearman, Precision\@K, reorder stats  
6. Deliver practical upload/rank/rate/enhance/export workflows  
7. Present implementation-grounded technical thesis

### 1.5 Scope

#### In scope

- Firebase auth + Firestore role/profile
- Resume/JD ingestion and extraction
- Job and candidate ranking pipelines
- Feedback capture and re-ranking
- Metrics logging and comparison

#### Out of scope

- Production hardening at scale
- Learning-to-rank training
- Large external human-labeled benchmarks
- Fairness auditing framework

### 1.6 Research Positioning

JobFusion is positioned as an IR-inspired retrieval-and-ranking system emphasizing semantic relevance, interpretable hybrid scoring, incremental personalization, and metric-based evaluation.

### 1.7 Expected Contributions

- Unified two-sided recruitment architecture
- TF-IDF + SBERT + FAISS practical integration
- Transparent scoring formulation
- Feedback adaptation loop
- Longitudinal ranking metric logging

### 1.8 Assumptions and Constraints

- Text-centric modeling
- Ratings as valid preference signal
- Controlled internal evaluation assumptions
- CSV-backed prototype data layer

### 1.9 Chapter Summary

Chapter 1 establishes motivation, problem framing, scope, and contribution baseline for the remainder of the thesis.

---

## Chapter 2: Literature Survey

### 2.1 Introduction

The survey is aligned with actual implementation pillars: IR framing, semantic embeddings, vector search scalability, relevance feedback, hybrid ranking, and IR evaluation metrics.

### 2.2 Recruitment as IR

Resumes/JDs are queries and jobs/candidates are documents. Ranking relevance is a better formulation than binary filtering.

### 2.3 Keyword Screening Limitations

- Vocabulary mismatch
- Surface matching bias
- Reduced recall
- Keyword stuffing effects

### 2.4 Semantic Similarity (SBERT)

SBERT enables efficient semantic embeddings suitable for retrieval. JobFusion uses `paraphrase-MiniLM-L6-v2`.

### 2.5 FAISS and Scalability

Dense retrieval needs optimized vector search. FAISS supports scalable nearest-neighbor retrieval.

### 2.6 Relevance Feedback and Personalization

Rocchio-style relevance feedback motivates preference-vector adaptation from ratings.

### 2.7 Hybrid Ranking and Explainability

Combining semantic and structured features improves practical relevance and interpretability.

### 2.8 Evaluation Metrics in Literature

- NDCG for ranking quality
- Precision\@K for top-k relevance
- Spearman for ranking stability
- Reorder % for personalization effect

### 2.9 Related Baselines

Most open-source recruitment projects are feature-isolated and lack two-sided unified architecture + metric-instrumented feedback re-ranking.

### 2.10 Research Gaps Identified

- Semantic-to-operational bridging
- Two-sided consistency
- Feedback utilization
- Evaluation rigor
- Scalability + explainability balance

### 2.11 JobFusion Positioning

IR-grounded, semantic-first, hybrid-scored, feedback-adaptive, metric-instrumented, two-sided platform.

### 2.12 Chapter Summary

Literature supports JobFusion’s design choices and motivates the implemented methodology.

---

## Chapter 3: Methodology

### 3.1 Introduction

Methodology covers architecture, module design, APIs, preprocessing, scoring formulas, feedback learning, and evaluation flow.

### 3.2 System Architecture

1. Presentation Layer (React)  
2. API Layer (Flask)  
3. Intelligence Layer (SBERT + TF-IDF + FAISS + scoring)  
4. Data Layer (Firebase + CSV persistence)

### 3.3 Technology Stack

- Frontend: React, Router, Axios, Tailwind
- Backend: Flask, Flask-CORS, Pandas, NumPy, Scikit-learn, PyMuPDF
- AI: sentence-transformers, FAISS, SciPy
- Auth/Profile: Firebase Auth + Firestore

### 3.4 Module-Wise Methodology

#### Authentication

Firebase login/signup and role-based routing.

#### Jobseeker pipeline

1. Upload resume  
2. Extract text  
3. Preprocess  
4. TF-IDF prefilter  
5. Embedding + FAISS retrieval  
6. Feature scoring + adjusted score  
7. Rank output  
8. Rating feedback -> enhancement

#### Recruiter pipeline

1. Input/upload JD  
2. Preprocess  
3. JD embedding query against resume FAISS index  
4. Apply hybrid score and constraints  
5. Rank candidates  
6. Capture ratings -> enhancement

### 3.5 API Methodology

- `/api/jobseeker/extract`
- `/api/jobseeker/recommend`
- `/api/jobseeker/rate`
- `/api/jobseeker/enhance`
- `/api/recruiter/rank`
- `/api/recruiter/rate`
- `/api/recruiter/enhance`

### 3.6 Preprocessing

- Lowercasing
- Punctuation removal
- Whitespace normalization
- Regex experience extraction
- Skill overlap tokenization

### 3.7 Mathematical Formulation

- Embedding: `e_t = MiniLM(t), e_t in R^384`
- TF-IDF lexical candidate filtering
- FAISS inner-product semantic retrieval
- Jobseeker score:
  - `alpha*sim_resume + (1-alpha)*sim_user + skill_boost + wL*L + wS*S + wE*E`
- Recruiter score:
  - baseline: `0.5*semantic + 0.3*skill + 0.2*experience`
  - enhanced: `alpha*base + (1-alpha)*feedback_sim`
- Adaptive alpha:
  - `clip(0.9 - 0.04*N, 0.5, 0.9)`

### 3.8 Feedback Learning

- Ratings -> normalized weights -> preference centroid vector
- Blend baseline score with preference similarity

### 3.9 Evaluation Methodology

- Jobseeker: NDCG, Spearman, reorder %
- Recruiter: Precision\@K, NDCG\@K, NDCG before/after, Spearman, reorder %

### 3.10 Flowcharts (Text)

- Jobseeker workflow
- Recruiter workflow
- Upload flow
- Recommendation engine flow
- Ranking evaluation flow

### 3.11 Pseudocode

Provided for both job recommendation and recruiter ranking with feedback.

### 3.12 Strengths and Limitations

**Strengths:** two-sided design, semantic retrieval, interpretable scoring, feedback adaptation, metric logging  
**Limitations:** lightweight preprocessing, controlled-label assumptions, CSV persistence, manual weighting

### 3.13 Chapter Summary

Chapter 3 defines the full implementation methodology used in the system.

---

## Chapter 4: Results and Discussion

### 4.1 Introduction

This chapter evaluates implemented outputs and ranking behaviors across both modules.

### 4.2 Experimental Context

Local full-stack prototype with React + Flask + Firebase + CSV metrics.

### 4.3 Jobseeker Results

- End-to-end flow execution confirmed
- Ranked jobs with matched skills and score breakdown
- Feedback enhancement produces measurable reorder while preserving high ranking quality

### 4.4 Recruiter Results

- End-to-end ranking and shortlist export confirmed
- Baseline metrics logged (Precision\@K, NDCG\@K)
- Enhancement computes before/after comparison and stability indicators

### 4.5 Dashboard-Level Findings

- Human-in-the-loop control is operational
- Ranking decisions are visible and adjustable
- Metrics provide objective transparency

### 4.6 Baseline vs Enhanced

- Baseline: strong cold-start relevance
- Enhanced: adaptive personalization with controlled shifts

### 4.7 Practical Findings

1. Semantic retrieval works in both modules  
2. Hybrid scoring improves decision utility  
3. Feedback loop materially affects rankings  
4. Metrics enable measurable ranking intelligence

### 4.8 Limitations

- Controlled internal setup
- Heuristic labels for parts of recruiter evaluation
- No large external annotated benchmark

### 4.9 Chapter Summary

Results validate the implemented system’s functionality and ranking behavior.

---

## Chapter 5: Graphs and Evaluation Analysis

### 5.1 Introduction

This chapter formalizes quantitative evaluation dimensions and recommended visualizations.

### 5.2 Evaluation Dimensions

1. Top-rank quality (NDCG\@K, Precision\@K)  
2. Stability (Spearman)  
3. Personalization impact (Reordered %)  
4. Before/after lift (NDCG delta)

### 5.3 Metrics

- NDCG\@K
- Precision\@K
- Spearman correlation
- Reordered %

### 5.4 Jobseeker Analysis

Observed behavior shows high quality + high stability + non-zero personalization.

### 5.5 Recruiter Analysis

NDCG remains strong while Precision varies with constraints. Feedback provides interpretable re-ranking changes.

### 5.6 Recommended Thesis Figures

1. Jobseeker NDCG trend  
2. Jobseeker Spearman vs Reorder  
3. Recruiter Precision trend  
4. Recruiter NDCG trend  
5. Recruiter NDCG before vs after  
6. Reordered % comparison  
7. Module-wise consolidated radar/bar

### 5.7 Recommended Tables

- Jobseeker summary
- Recruiter summary
- Before-vs-after sample table

### 5.8 Comparative Discussion

Both modules achieve measurable semantic ranking quality and feedback-driven improvement.

### 5.9 Threats to Validity

- Controlled setup
- Label assumptions
- Dataset representativeness
- Cold-start effects

### 5.10 Chapter Summary

Chapter 5 presents robust, thesis-ready evaluation framing and visualization plan.

---

## Chapter 6: Conclusion

### 6.1 Overview

JobFusion delivers a unified AI-assisted recruitment platform for both job seekers and recruiters.

### 6.2 Objective Achievement

All major planned objectives were implemented in current branch scope.

### 6.3 Technical Contributions

- Two-sided unified architecture
- Semantic-first retrieval
- Hybrid interpretable scoring
- Feedback-driven personalization
- Evaluation instrumentation

### 6.4 Practical Outcomes

Platform supports operational workflows for ranking, feedback, and measurable improvement.

### 6.5 Key Findings

- Semantic retrieval > keyword-only matching
- Hybrid scoring improves practical utility
- Feedback enhances ranking while preserving stability

### 6.6 Limitations

- Internal evaluation
- Heuristic relevance assumptions
- CSV prototype persistence
- Manual weighting

### 6.7 Final Conclusion

JobFusion is a strong M.Tech-level applied AI system and a base for LTR, fairness-aware, and production-scale future research.

---

## Chapter 7: Future Scope

### 7.1 Introduction

This chapter outlines realistic expansion paths from prototype to production-grade system.

### 7.2 Algorithmic Expansion

- Learning-to-rank integration
- Domain-adaptive embeddings
- Section-aware resume/JD matching

### 7.3 Personalization Expansion

- Cold-start personalization
- Implicit feedback modeling
- Temporal/session-aware adaptation

### 7.4 Recruiter Expansion

- Advanced analytics dashboards
- Explainable score decomposition
- Collaborative multi-reviewer ranking

### 7.5 Evaluation Expansion

- Human-annotated relevance benchmarks
- Expanded metric suite (MAP/MRR/calibration/fairness)
- Online A/B testing

### 7.6 Engineering Expansion

- Production databases + vector stores
- Larger ANN index strategies
- MLOps and monitoring

### 7.7 Responsible AI Roadmap

- Bias/fairness auditing
- Transparent ranking policy controls
- Human oversight and governance

### 7.8 Chapter Summary

Future work spans modeling, evaluation rigor, engineering maturity, and responsible deployment.

---

## Chapter 8: References (Final Optimized)

1. Reimers, N., & Gurevych, I. (2019). *Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks*. EMNLP-IJCNLP.  
2. Wang, W., et al. (2020). *MiniLM: Deep Self-Attention Distillation for Task-Agnostic Compression of Pre-Trained Transformers*. NeurIPS.  
3. Johnson, J., Douze, M., & Jégou, H. (2017). *Billion-scale similarity search with GPUs*. arXiv:1702.08734.  
4. Douze, M., et al. (2024). *The FAISS Library*. arXiv:2401.08281.  
5. Meta AI / Facebook Research. *FAISS Documentation and Repository*. https://github.com/facebookresearch/faiss  
6. Manning, C. D., Raghavan, P., & Schütze, H. (2009). *Introduction to Information Retrieval*. Cambridge University Press.  
7. Järvelin, K., & Kekäläinen, J. (2002). “Cumulated gain-based evaluation of IR techniques,” *ACM TOIS*, 20(4), 422–446.  
8. Liu, T.-Y. (2009). *Learning to Rank for Information Retrieval*. Springer.  
9. Rocchio, J. J. (1971). “Relevance feedback in information retrieval,” in *The SMART Retrieval System*.  
10. Burke, R. (2002). “Hybrid recommender systems: Survey and experiments,” *User Modeling and User-Adapted Interaction*, 12(4), 331–370.  
11. Adomavicius, G., & Tuzhilin, A. (2005). “Toward the next generation of recommender systems,” *IEEE TKDE*, 17(6), 734–749.  
12. Zhang, Y., & Chen, X. (2020). “Explainable recommendation: A survey and new perspectives,” *Foundations and Trends in IR*, 14(1), 1–101.  
13. Singh, A., & Rose, C. *Automated Resume Screening: A Survey* (IJIRR, as cited in project materials).  
14. LinkedIn Talent Solutions. *Understanding ATS Resume Screening* (Industry Report).  
15. React Team. *React Documentation*. https://react.dev  
16. Pallets. *Flask Documentation*. https://flask.palletsprojects.com  
17. Google Firebase. *Firebase Documentation (Authentication & Firestore)*. https://firebase.google.com/docs  
18. Pedregosa, F., et al. (2011). “Scikit-learn: Machine learning in Python,” *JMLR*, 12, 2825–2830; https://scikit-learn.org  
19. Virtanen, P., et al. (2020). “SciPy 1.0: Fundamental Algorithms for Scientific Computing in Python,” *Nature Methods*, 17, 261–272; https://docs.scipy.org  

---

## Mapping References to Project Components

- **Recommendation system (jobseeker):** 1, 2, 3, 4, 5, 10, 11, 18
- **Resume screening:** 1, 6, 13, 14
- **Candidate ranking (recruiter):** 1, 3, 4, 6, 8, 9, 10
- **NLP / TF-IDF / cosine similarity:** 1, 2, 6, 18
- **React frontend:** 15
- **Flask backend:** 16
- **Firebase auth/database:** 17
- **Evaluation (NDCG / Spearman / Precision):** 7, 8, 18, 19
- **AI recruitment context:** 12, 13, 14

