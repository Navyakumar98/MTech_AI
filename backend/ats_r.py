from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import docx


def _extract_pdf_text(file_path):
    """Try PyMuPDF first (already in requirements), then pdfminer, then PyPDF2."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        try:
            return "\n".join(page.get_text("text") for page in doc)
        finally:
            doc.close()
    except Exception:
        pass

    try:
        from pdfminer.high_level import extract_text
        return extract_text(file_path)
    except Exception:
        pass

    try:
        import PyPDF2
        text = ""
        with open(file_path, "rb") as fh:
            reader = PyPDF2.PdfReader(fh)
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text += t
        return text
    except Exception as e:
        print("PDF extraction failed:", e)
        return ""


def extract_text_from_file(file_path):
    if file_path.lower().endswith(".pdf"):
        return _extract_pdf_text(file_path)
    if file_path.lower().endswith(".docx"):
        doc = docx.Document(file_path)
        return "\n".join(para.text for para in doc.paragraphs)
    return ""


def calculate_ats_score(jd_text, resume_path):
    resume_text = extract_text_from_file(resume_path) or ""
    if not resume_text.strip() or not (jd_text or "").strip():
        return 0.0
    documents = [jd_text, resume_text]
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(documents)
    score = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0] * 100
    return round(float(score), 2)
