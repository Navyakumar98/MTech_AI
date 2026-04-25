import os
import fitz
import re
import pandas as pd
from flask import Blueprint, request, jsonify

api_bp = Blueprint('api', __name__)

recommender = None
ranking_system = None
_recommender_err = None
_ranking_err = None
_job_recommendation_cls = None
_recruiter_ranking_cls = None


def _load_model_classes():
    """
    Import ML classes only when needed.
    This keeps app startup lightweight so the web process can bind PORT first.
    """
    global _job_recommendation_cls, _recruiter_ranking_cls
    if _job_recommendation_cls is None:
        from ai_model import JobRecommendationSystem
        _job_recommendation_cls = JobRecommendationSystem
    if _recruiter_ranking_cls is None:
        from ai_recruiter_model import RecruiterRankingSystem
        _recruiter_ranking_cls = RecruiterRankingSystem


def _find_jobs_csv():
    """
    Try a handful of reasonable locations for JobsFE.csv. If none exist,
    fall back to a small bundled demo dataset so the API is still usable
    during development.
    """
    base_dir = os.path.dirname(__file__)
    candidates = [
        os.path.join(base_dir, "JobsFE.csv"),
        os.path.join(base_dir, "data", "JobsFE.csv"),
    ]
    for p in candidates:
        if os.path.exists(p):
            return os.path.abspath(p)

    demo_path = os.path.join(base_dir, "data", "JobsFE_demo.csv")
    if not os.path.exists(demo_path):
        _generate_demo_jobs_csv(demo_path)
    print(
        "[api_blueprint] WARNING: JobsFE.csv not found. "
        f"Using bundled demo dataset at {demo_path}. "
        "Drop a real JobsFE.csv into backend/ (or backend/data/) for full results."
    )
    return demo_path


def _generate_demo_jobs_csv(path):
    """Build a tiny but realistic JobsFE.csv so the jobseeker flow has data."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    rows = [
        ("J001", "Berlin Germany", "Remote", 120000, "Python Developer",
         "Build REST APIs with Flask/Django. Work with SQL and AWS.",
         "python flask django sql aws 3+ years Bachelor"),
        ("J002", "London UK", "Hybrid", 140000, "Senior Python Engineer",
         "Design microservices and data pipelines in Python.",
         "python fastapi postgres docker kubernetes 5+ years Bachelor"),
        ("J003", "Berlin Germany", "Onsite", 95000, "Frontend Developer",
         "Implement modern SPA UIs with React and TypeScript.",
         "react typescript javascript css html 2+ years Bachelor"),
        ("J004", "Remote", "Remote", 180000, "Machine Learning Engineer",
         "Ship ML models to production and monitor performance.",
         "python pytorch tensorflow nlp mlops 4+ years Masters"),
        ("J005", "New York USA", "Hybrid", 200000, "Data Scientist",
         "Analyze product data and build predictive models.",
         "python sql machine learning statistics 3+ years Masters"),
        ("J006", "San Francisco USA", "Onsite", 160000, "Full Stack Engineer",
         "Build features across React frontend and Node/Python backend.",
         "react node.js python postgres aws 3+ years Bachelor"),
        ("J007", "Bangalore India", "Hybrid", 60000, "Java Developer",
         "Develop backend services with Spring Boot and microservices.",
         "java spring boot microservices sql 3+ years Bachelor"),
        ("J008", "Amsterdam Netherlands", "Remote", 110000, "DevOps Engineer",
         "Manage Kubernetes clusters and CI/CD pipelines.",
         "docker kubernetes aws terraform linux ci/cd 4+ years Bachelor"),
        ("J009", "Toronto Canada", "Hybrid", 130000, "Backend Engineer",
         "Build high-throughput services in Go or Python.",
         "python go postgres redis kafka 4+ years Bachelor"),
        ("J010", "Berlin Germany", "Remote", 150000, "AI Engineer",
         "Prototype and productionize LLM-powered features.",
         "python llm nlp pytorch huggingface 3+ years Masters"),
        ("J011", "Paris France", "Onsite", 90000, "Data Analyst",
         "Produce dashboards and ad-hoc analyses for product teams.",
         "sql tableau excel python 2+ years Bachelor"),
        ("J012", "Singapore", "Hybrid", 170000, "Cloud Architect",
         "Design multi-region AWS architectures for regulated workloads.",
         "aws azure terraform kubernetes 7+ years Bachelor"),
        ("J013", "Sydney Australia", "Remote", 135000, "NLP Engineer",
         "Build search and recommendation models over text data.",
         "python nlp transformers pytorch faiss 3+ years Masters"),
        ("J014", "Dublin Ireland", "Hybrid", 115000, "Platform Engineer",
         "Own developer tooling, infra, and observability stack.",
         "kubernetes docker python terraform aws 4+ years Bachelor"),
        ("J015", "Remote", "Remote", 105000, "QA Automation Engineer",
         "Write end-to-end tests and maintain CI pipelines.",
         "python selenium playwright ci/cd 3+ years Bachelor"),
        ("J016", "Zurich Switzerland", "Onsite", 175000, "Security Engineer",
         "Threat modeling, pentesting and IAM for cloud apps.",
         "aws iam security pentesting python 5+ years Bachelor"),
        ("J017", "Austin USA", "Hybrid", 145000, "Mobile Engineer",
         "Ship iOS and Android apps with React Native.",
         "react native javascript typescript ios android 3+ years Bachelor"),
        ("J018", "Chicago USA", "Onsite", 125000, "Database Engineer",
         "Tune Postgres and build data replication pipelines.",
         "postgres mysql sql python 4+ years Bachelor"),
        ("J019", "Munich Germany", "Hybrid", 130000, "SRE",
         "Keep production healthy, lead incident response.",
         "kubernetes aws prometheus grafana python 4+ years Bachelor"),
        ("J020", "Remote", "Remote", 155000, "Staff Engineer",
         "Cross-team technical leadership across services.",
         "python system design distributed systems 8+ years Bachelor"),
    ]
    df = pd.DataFrame(rows, columns=[
        "Job Id", "workplace", "working_mode", "salary", "position",
        "job_role_and_duties", "requisite_skill",
    ])
    df["offer_details"] = ""
    df.to_csv(path, index=False)


def init_models():
    """
    Lazy-init the heavy ML models. Safe to call on every request: after the
    first successful load it's a no-op. Errors are cached so we don't retry
    embedding a 1M-row CSV on every request.
    """
    global recommender, ranking_system, _recommender_err, _ranking_err
    base_dir = os.path.dirname(__file__)

    if recommender is None and _recommender_err is None:
        try:
            _load_model_classes()
            jobs_csv = _find_jobs_csv()
            if jobs_csv is None:
                raise FileNotFoundError(
                    "JobsFE.csv not found. Place it at backend/JobsFE.csv "
                    "(or backend/data/JobsFE.csv). This file is gitignored."
                )
            recommender = _job_recommendation_cls(jobs_csv)
        except Exception as e:
            _recommender_err = str(e)
            print("Failed to load JobRecommendationSystem:", e)

    if ranking_system is None and _ranking_err is None:
        try:
            _load_model_classes()
            resumes_csv = os.path.join(base_dir, "data", "resumes.csv")
            if not os.path.exists(resumes_csv):
                raise FileNotFoundError(f"resumes.csv not found at {resumes_csv}")
            ranking_system = _recruiter_ranking_cls(os.path.join("data", "resumes.csv"))
        except Exception as e:
            _ranking_err = str(e)
            print("Failed to load RecruiterRankingSystem:", e)


def _require_recommender():
    init_models()
    if recommender is None:
        return jsonify({
            "error": "Job recommendation model is not available",
            "details": _recommender_err or "Unknown init error"
        }), 503
    return None


def _require_ranking():
    init_models()
    if ranking_system is None:
        return jsonify({
            "error": "Recruiter ranking model is not available",
            "details": _ranking_err or "Unknown init error"
        }), 503
    return None


def extract_text_from_pdf(file_obj):
    doc = fitz.open(stream=file_obj.read(), filetype="pdf")
    text = "\n".join([page.get_text("text") for page in doc])
    return text.strip()

RATINGS_DIR = os.path.join(os.path.dirname(__file__), "data")
RATINGS_PATH = os.path.join(RATINGS_DIR, "ratings.csv")
RECRUITER_RATINGS_PATH = os.path.join(RATINGS_DIR, "recruiter_ratings.csv")

def save_rating(resume_id, job_id, rating):
    os.makedirs(RATINGS_DIR, exist_ok=True)
    rating_value = int(rating)
    if os.path.exists(RATINGS_PATH):
        df = pd.read_csv(RATINGS_PATH)
    else:
        df = pd.DataFrame(columns=["resume_id", "job_id", "rating"])

    if not df.empty:
        df["resume_id"] = df["resume_id"].astype(str)
        df["job_id"] = df["job_id"].astype(str)

    new_entry = {"resume_id": str(resume_id), "job_id": str(job_id), "rating": rating_value}

    mask = (df["resume_id"] == str(resume_id)) & (df["job_id"] == str(job_id))
    if mask.any():
        df.loc[mask, "rating"] = rating_value
    else:
        df = pd.concat([df, pd.DataFrame([new_entry])], ignore_index=True)

    df["rating"] = df["rating"].astype(int)
    df.to_csv(RATINGS_PATH, index=False)

def save_recruiter_rating(jd_id, candidate_id, rating):
    os.makedirs(RATINGS_DIR, exist_ok=True)
    rating_value = int(rating)
    if os.path.exists(RECRUITER_RATINGS_PATH):
        df = pd.read_csv(RECRUITER_RATINGS_PATH)
    else:
        df = pd.DataFrame(columns=["jd_id", "candidate_id", "rating"])

    if not df.empty:
        df["jd_id"] = df["jd_id"].astype(str)
        df["candidate_id"] = df["candidate_id"].astype(str)

    new_entry = {"jd_id": str(jd_id), "candidate_id": str(candidate_id), "rating": rating_value}

    mask = (df["jd_id"] == str(jd_id)) & (df["candidate_id"] == str(candidate_id))
    if mask.any():
        df.loc[mask, "rating"] = rating_value
    else:
        df = pd.concat([df, pd.DataFrame([new_entry])], ignore_index=True)

    df["rating"] = df["rating"].astype(int)
    df.to_csv(RECRUITER_RATINGS_PATH, index=False)


def extract_candidate_details(text):
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    name = lines[0] if lines else "Unknown"
    email_match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    email = email_match.group(0) if email_match else "Unknown"
    phone_match = re.search(r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
    phone = phone_match.group(0) if phone_match else "Unknown"
    exp_match = re.search(r"(\d+)\s*\+?\s*years?", text, re.IGNORECASE)
    experience = int(exp_match.group(1)) if exp_match else 0
    common_skills = {"python", "java", "aws", "docker", "react", "sql", "machine learning", "nlp", "kubernetes", "c++", "javascript", "node.js", "django", "flask", "pytorch", "tensorflow", "vue.js", "css", "html", "azure", "linux", "oracle"}
    found_skills = {s for s in common_skills if s in text.lower()}
    skills_str = ";".join(found_skills) if found_skills else "Unknown"
    return name, email, phone, experience, skills_str

def save_resume_for_recruiter(resume_text):
    os.makedirs(RATINGS_DIR, exist_ok=True)
    resumes_file = os.path.join(RATINGS_DIR, "resumes.csv")
    name, email, phone, experience, skills = extract_candidate_details(resume_text)
    if os.path.exists(resumes_file):
        df = pd.read_csv(resumes_file)
        next_id = int(df["candidate_id"].max()) + 1 if not df.empty else 1
    else:
        df = pd.DataFrame(columns=["candidate_id", "name", "phone", "email", "resume_text", "skills", "experience"])
        next_id = 1
    if not df.empty and resume_text in df["resume_text"].values:
        return
    new_entry = {
        "candidate_id": next_id,
        "name": name,
        "phone": phone,
        "email": email,
        "resume_text": resume_text,
        "skills": skills,
        "experience": experience,
        "salary": 0,
    }
    df = pd.concat([df, pd.DataFrame([new_entry])], ignore_index=True)
    if "salary" in df.columns:
        df["salary"] = df["salary"].fillna(0)
    if "experience" in df.columns:
        df["experience"] = df["experience"].fillna(0)
    df.to_csv(resumes_file, index=False)


@api_bp.route('/jobseeker/extract', methods=['POST'])
def extract_resume():
    if 'resume' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files['resume']
    try:
        text = extract_text_from_pdf(file)
        resume_id = hash(text) % (10**8)
        save_resume_for_recruiter(text)
        return jsonify({"text": text, "resume_id": str(resume_id)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/jobseeker/recommend', methods=['POST'])
def recommend():
    guard = _require_recommender()
    if guard is not None:
        return guard

    data = request.json or {}
    text = data.get('resume_text')
    if not text:
        return jsonify({"error": "Missing resume text"}), 400

    try:
        results = recommender.recommend_jobs(
            text,
            top_n=20,
            use_feedback=True,
            location_weight=float(data.get('location_weight', 0.1) or 0.1),
            salary_weight=float(data.get('salary_weight', 0.1) or 0.1),
            experience_weight=float(data.get('experience_weight', 0.1) or 0.1),
            user_location=data.get('user_location', ''),
            user_salary=str(data.get('user_salary', '')),
            user_experience=str(data.get('user_experience', ''))
        )
        return jsonify(results)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@api_bp.route('/jobseeker/rate', methods=['POST'])
def rate():
    data = request.json
    try:
        save_rating(data['resume_id'], data['job_id'], data['rating'])
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/jobseeker/enhance', methods=['POST'])
def enhance():
    guard = _require_recommender()
    if guard is not None:
        return guard

    data = request.json or {}
    if not data.get('resume_text'):
        return jsonify({"error": "Missing resume text"}), 400
    try:
        res = recommender.retrain_with_feedback(data['resume_text'], top_n=20)
        res.pop("comparison", None)
        return jsonify(res)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@api_bp.route('/recruiter/rank', methods=['POST'])
def rank():
    guard = _require_ranking()
    if guard is not None:
        return guard

    try:
        data = request.json or {}

        jd_text = data.get('jd_text')
        if not jd_text or not str(jd_text).strip():
            return jsonify({"error": "Missing jd text"}), 400

        max_salary = data.get('max_salary')
        if max_salary in ("", None):
            max_salary = None
        else:
            try:
                max_salary = float(max_salary)
            except (TypeError, ValueError):
                max_salary = None

        candidates, metrics = ranking_system.rank_candidates(
            jd_text,
            top_k=int(data.get('top_k', 20) or 20),
            min_experience=float(data.get('min_exp', 0) or 0),
            max_salary=max_salary,
            use_feedback=False,
            jd_id=data.get('jd_id')
        )

        return jsonify({
            "candidates": candidates,
            "metrics": metrics
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@api_bp.route('/recruiter/rate', methods=['POST'])
def rate_recruiter():
    data = request.json
    try:
        save_recruiter_rating(data['jd_id'], data['candidate_id'], data['rating'])
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/recruiter/enhance', methods=['POST'])
def enhance_recruiter():
    guard = _require_ranking()
    if guard is not None:
        return guard

    data = request.json or {}
    if not data.get('jd_text'):
        return jsonify({"error": "Missing jd text"}), 400

    max_salary = data.get('max_salary')
    if max_salary in ("", None):
        max_salary = None
    else:
        try:
            max_salary = float(max_salary)
        except (TypeError, ValueError):
            max_salary = None

    try:
        res = ranking_system.retrain_with_feedback(
            data['jd_text'],
            jd_id=data.get('jd_id'),
            top_k=int(data.get('top_k', 20) or 20),
            min_experience=float(data.get('min_exp', 0) or 0),
            max_salary=max_salary
        )
        res.pop("comparison", None)
        return jsonify(res)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
