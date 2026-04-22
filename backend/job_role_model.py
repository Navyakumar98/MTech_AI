import os
import joblib
import docx
import PyPDF2
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_PATH, 'job_role_model.pkl')
VECTORIZER_PATH = os.path.join(BASE_PATH, 'vectorizer.pkl')
DATASET_PATH = os.path.join(BASE_PATH, 'resume_dataset.csv')

_model = None
_vectorizer = None


def _train_and_save():
    """
    Train a tiny Naive Bayes role classifier from resume_dataset.csv and
    persist it. Falls back to a hard-coded toy dataset if the CSV is missing
    so the API never crashes at import time.
    """
    if os.path.exists(DATASET_PATH):
        df = pd.read_csv(DATASET_PATH)
        resumes = df['resume'].astype(str).tolist()
        roles = df['job_role'].astype(str).tolist()
    else:
        resumes = [
            'Software developer experienced in Java and Spring Boot',
            'Data scientist with expertise in Python, ML and deep learning',
            'Web developer skilled in React.js, HTML and CSS',
            'Cloud and DevOps engineer with AWS, Docker and Kubernetes',
        ]
        roles = [
            'Software Developer', 'Data Scientist',
            'Web Developer', 'DevOps Engineer',
        ]

    vectorizer = TfidfVectorizer()
    X = vectorizer.fit_transform(resumes)
    model = MultinomialNB()
    model.fit(X, roles)

    try:
        joblib.dump(model, MODEL_PATH)
        joblib.dump(vectorizer, VECTORIZER_PATH)
    except Exception as e:
        print("Warning: could not persist role model:", e)

    return model, vectorizer


def _load_models():
    """Load cached pkls; train from CSV if they're missing."""
    global _model, _vectorizer
    if _model is not None and _vectorizer is not None:
        return _model, _vectorizer

    if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
        try:
            _model = joblib.load(MODEL_PATH)
            _vectorizer = joblib.load(VECTORIZER_PATH)
            return _model, _vectorizer
        except Exception as e:
            print("Failed to load cached role model, retraining:", e)

    _model, _vectorizer = _train_and_save()
    return _model, _vectorizer


def get_resume_text(file_path):
    text = ""
    try:
        if file_path.lower().endswith(".pdf"):
            with open(file_path, "rb") as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text
        elif file_path.lower().endswith(".docx"):
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"
    except Exception as e:
        print("Error reading resume file:", e)
    return text


def predict_job_roles(resume_text):
    try:
        model, vectorizer = _load_models()
        transformed_text = vectorizer.transform([resume_text or ""])
        prediction = model.predict(transformed_text)
        return [str(prediction[0])]
    except Exception as e:
        print("Error in prediction:", e)
        return ["Could not predict"]
