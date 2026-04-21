import os
import fitz
import re
import pandas as pd
from flask import Blueprint, request, jsonify
from ai_model import JobRecommendationSystem
from ai_recruiter_model import RecruiterRankingSystem

api_bp = Blueprint('api', __name__)

recommender = None
ranking_system = None

def init_models():
    global recommender, ranking_system
    if recommender is None:
        try:
            recommender = JobRecommendationSystem("backend/JobsFE.csv")
        except Exception as e:
            print("Failed to load JobRecommendationSystem:", e)
    if ranking_system is None:
        try:
            ranking_system = RecruiterRankingSystem("backend/resume_dataset.csv") # Assuming this is the correct CSV based on the files available
        except Exception as e:
            print("Failed to load RecruiterRankingSystem:", e)

init_models()

def extract_text_from_pdf(file_obj):
    doc = fitz.open(stream=file_obj.read(), filetype="pdf")
    text = "\n".join([page.get_text("text") for page in doc])
    return text.strip()

RATINGS_DIR = "data"
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
        "experience": experience
    }
    df = pd.concat([df, pd.DataFrame([new_entry])], ignore_index=True)
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
    data = request.json
    text = data.get('resume_text')
    if not text:
        return jsonify({"error": "Missing resume text"}), 400

    try:
        results = recommender.recommend_jobs(
            text,
            top_n=20,
            use_feedback=True,
            location_weight=data.get('location_weight', 0.1),
            salary_weight=data.get('salary_weight', 0.1),
            experience_weight=data.get('experience_weight', 0.1),
            user_location=data.get('user_location', ''),
            user_salary=str(data.get('user_salary', '')),
            user_experience=str(data.get('user_experience', ''))
        )
        # Handle numpy arrays to list/float for json serialization if needed
        return jsonify(results)
    except Exception as e:
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
    data = request.json
    try:
        res = recommender.retrain_with_feedback(data['resume_text'], top_n=20)
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@api_bp.route('/recruiter/rank', methods=['POST'])
def rank():
    data = request.json
    jd_text = data.get('jd_text')
    if not jd_text:
        return jsonify({"error": "Missing jd text"}), 400
    try:
        candidates, metrics = ranking_system.rank_candidates(
            jd_text,
            top_k=data.get('top_k', 20),
            min_experience=data.get('min_exp', 0),
            max_salary=data.get('max_salary'),
            use_feedback=False,
            jd_id=data.get('jd_id')
        )
        return jsonify({"candidates": candidates, "metrics": metrics})
    except Exception as e:
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
    data = request.json
    try:
        res = ranking_system.retrain_with_feedback(
            data['jd_text'],
            jd_id=data.get('jd_id'),
            top_k=data.get('top_k', 20),
            min_experience=data.get('min_exp', 0),
            max_salary=data.get('max_salary')
        )
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
