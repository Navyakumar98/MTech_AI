import streamlit as st
import pandas as pd
import fitz
from recruiter_model import RecruiterRankingSystem


# ---------------- PAGE CONFIG ----------------

st.set_page_config(
    page_title="Recruiter Dashboard",
    page_icon="🎯",
    layout="wide"
)


# ---------------- UI STYLES ----------------

st.markdown("""
<style>

.block-container{
padding-top:2rem;
padding-bottom:2rem;
}

.main{
background-color:#f0f2f6;
}

h1,h2,h3,h4,h5,h6{
color:#262730;
}

.stButton>button{
background:#0078ff;
color:white;
border-radius:8px;
border:2px solid #0078ff;
font-weight:bold;
padding:8px 16px;
}

.stButton>button:hover{
background:white;
color:#0078ff;
}

.card{
background:white;
padding:20px;
border-radius:12px;
border:1px solid #e5e7eb;
box-shadow:0 2px 6px rgba(0,0,0,0.05);
}

.job-card{
background:white;
border-radius:12px;
padding:20px;
border:1px solid #e8e8e8;
box-shadow:0 4px 12px rgba(0,0,0,0.08);
margin-bottom:20px;
}

.tag{
display:inline-block;
padding:4px 10px;
margin:3px;
border-radius:12px;
background:#f1f5f9;
border:1px solid #e2e8f0;
font-size:13px;
}

.metric-pill{
display:inline-block;
padding:6px 12px;
border-radius:16px;
background:#eef4ff;
border:1px solid #cfe0ff;
margin-right:8px;
font-size:14px;
font-weight:500;
}

.section-title{
font-size:22px;
font-weight:600;
margin-bottom:6px;
margin-top:0px;
}

.info-banner{
margin-top:15px;
padding:12px;
border-radius:8px;
background:#eef4ff;
border-left:4px solid #0078ff;
font-size:14px;
}

</style>
""", unsafe_allow_html=True)


import os

# ---------------- CONSTANTS ----------------
RATINGS_DIR = os.path.join(os.getcwd(), "data")
RATINGS_PATH = os.path.join(RATINGS_DIR, "recruiter_ratings.csv")

# ---------------- SESSION STATE ----------------

for key, default in {
    "jd_text": "",
    "jd_id": None,
    "ranked_candidates": [],
    "ranking_metrics": {},
    "enhanced_results": None,
}.items():
    if key not in st.session_state:
        st.session_state[key] = default


# ---------------- LOAD MODEL ----------------

@st.cache_resource
def load_ranking_system():
    return RecruiterRankingSystem("data/resumes.csv")

ranking_system = load_ranking_system()


# ---------------- RATINGS HELPERS ----------------

def ensure_ratings_dir():
    os.makedirs(RATINGS_DIR, exist_ok=True)

def save_recruiter_rating(jd_id, candidate_id, rating):
    ensure_ratings_dir()
    rating_value = int(rating)

    if os.path.exists(RATINGS_PATH):
        df = pd.read_csv(RATINGS_PATH)
    else:
        df = pd.DataFrame(columns=["jd_id", "candidate_id", "rating"])

    if not df.empty:
        df["jd_id"] = df["jd_id"].astype(str)
        df["candidate_id"] = df["candidate_id"].astype(str)

    new_entry = {"jd_id": str(jd_id), "candidate_id": str(candidate_id), "rating": rating_value}

    mask = (df["jd_id"] == str(jd_id)) & (df["candidate_id"] == str(candidate_id))
    if mask.any():
        df.loc[mask, "rating"] = rating_value
        st.toast(f"🔄 Updated rating for candidate {candidate_id}")
    else:
        df = pd.concat([df, pd.DataFrame([new_entry])], ignore_index=True)
        # st.toast(f"💾 Added new rating for candidate {candidate_id}")

    df["rating"] = df["rating"].astype(int)
    df.to_csv(RATINGS_PATH, index=False)


def run_ranking_with_feedback(jd_text, top_k, min_exp, max_salary, jd_id):
    with st.spinner("Ranking candidates using feedback..."):
        candidates, metrics = ranking_system.rank_candidates(
            jd_text, top_k, min_exp, max_salary, use_feedback=True, jd_id=jd_id
        )
        st.session_state.ranked_candidates = candidates
        st.session_state.ranking_metrics = metrics
        st.session_state.enhanced_results = None


# ---------------- PDF TEXT EXTRACT ----------------

def extract_text_from_pdf(file):
    doc = fitz.open(stream=file.read(), filetype="pdf")
    return "\n".join(page.get_text() for page in doc)


# ============================================================
# MAIN LAYOUT
# ============================================================

left_col, right_col = st.columns([1,3])


# ---------------- FILTERS ----------------

with left_col:

    st.markdown("### Ranking Filters")

    top_k = st.selectbox(
        "Top Candidates",
        [10,20,50],
        index=1
    )

    min_exp = st.number_input(
        "Minimum Experience",
        min_value=0,
        value=0
    )

    max_salary = st.number_input(
        "Maximum Salary",
        min_value=0,
        value=150000,
        step=5000
    )


# ---------------- JOB DESCRIPTION ----------------

with right_col:

    st.markdown('<div class="card">', unsafe_allow_html=True)

    st.markdown(
        '<div class="section-title">Job Description</div>',
        unsafe_allow_html=True
    )

    jd_text = st.text_area(
        "Paste Job Description",
        value=st.session_state.jd_text,
        height=200
    )


    file = st.file_uploader(
        "Upload JD PDF (PDF only)",
        type=["pdf"]
    )


    if file:
        st.session_state.jd_text = extract_text_from_pdf(file)

        st.text_area(
            "Extracted Job Description",
            st.session_state.jd_text,
            height=200
        )

    elif jd_text:
        st.session_state.jd_text = jd_text


    if st.session_state.jd_text:
        st.session_state.jd_id = hash(st.session_state.jd_text) % 10**8


    btn_cols = st.columns(2)
    with btn_cols[0]:
        if st.button("Find Best Candidates"):

            if not st.session_state.jd_text.strip():
                st.error("Please enter Job Description")

            else:

                with st.spinner("Ranking candidates..."):

                    candidates, metrics = ranking_system.rank_candidates(
                        st.session_state.jd_text,
                        top_k,
                        min_exp,
                        max_salary=max_salary,
                        use_feedback=False,
                        jd_id=st.session_state.jd_id
                    )

                    st.session_state.ranked_candidates = candidates
                    st.session_state.ranking_metrics = metrics
                    st.session_state.enhanced_results = None

    with btn_cols[1]:
        if st.button("Enhance with AI Feedback", disabled=not bool(st.session_state.jd_text.strip())):
            with st.spinner("🧠 Retraining model using your feedback..."):
                st.session_state.enhanced_results = ranking_system.retrain_with_feedback(
                    st.session_state.jd_text,
                    jd_id=st.session_state.jd_id,
                    top_k=top_k,
                    min_experience=min_exp,
                    max_salary=max_salary
                )


    if len(st.session_state.ranked_candidates) == 0:

        st.markdown(
            """
            <div class="info-banner">
            Paste a <b>Job Description</b> and click 
            <b>Find Best Candidates</b> to see results.
            </div>
            """,
            unsafe_allow_html=True
        )

    st.markdown("</div>", unsafe_allow_html=True)


# ============================================================
# TOP RANKED OVERVIEW
# ============================================================

if len(st.session_state.ranked_candidates) > 0:

    st.markdown("---")
    st.markdown("### Top Ranked Overview")

    df = pd.DataFrame(st.session_state.ranked_candidates)

    cols = [
        "candidate_id",
        "name",
        "phone",
        "email",
        "salary",
        "final_score"
    ]

    cols = [c for c in cols if c in df.columns]

    if cols:
        st.dataframe(df[cols], use_container_width=True)


# ============================================================
# CANDIDATES LIST
# ============================================================

if len(st.session_state.ranked_candidates) > 0:

    st.markdown("---")
    st.markdown("### Candidates List")

    candidates = st.session_state.ranked_candidates

    for i, cand in enumerate(candidates):

        with st.container():

            st.markdown("<div class='job-card'>", unsafe_allow_html=True)

            cols = st.columns([3,1])

            with cols[0]:
                st.markdown(
                    f"#### Candidate {cand['candidate_id']} — {cand.get('name','Unknown')}"
                )

            with cols[1]:
                st.markdown(
                    f"<span style='float:right;'>Exp: {cand['experience']} yrs | Salary: ${cand.get('salary', 0):,}</span>",
                    unsafe_allow_html=True
                )

            score = cand["final_score"] * 100

            st.slider(
                "Match Score",
                0.0,
                100.0,
                float(score),
                disabled=True,
                key=f"score_{i}"
            )

            with st.expander("Details"):

                st.markdown(
                    f"**Phone:** {cand.get('phone','Unknown')} | "
                    f"**Email:** {cand.get('email','Unknown')}"
                )

                st.write(
                    f"**Resume Summary:** {cand['resume_summary']}"
                )

                # if cand["matched_skills"]:

                #     tags = "".join(
                #         [
                #             f"<span class='tag'>{s}</span>"
                #             for s in cand["matched_skills"]
                #         ]
                #     )

                #     st.markdown(
                #         f"**Matched Skills:** {tags}",
                #         unsafe_allow_html=True
                #     )

            feedback_cols = st.columns([3, 2])
            with feedback_cols[0]:
                rating = st.slider("Your Rating", 1, 5, 3, key=f"slider_{i}")
            with feedback_cols[1]:
                if st.button("Submit Feedback", key=f"rate_btn_{i}"):
                    save_recruiter_rating(st.session_state.jd_id, cand['candidate_id'], rating)
                    st.toast(f"⭐ You rated Candidate {cand['candidate_id']} as {rating}/5")
                    run_ranking_with_feedback(
                        st.session_state.jd_text,
                        top_k,
                        min_exp,
                        max_salary,
                        st.session_state.jd_id
                    )

            st.markdown("</div>", unsafe_allow_html=True)


# ============================================================
# ENHANCED MODEL DASHBOARD
# ============================================================

if st.session_state.enhanced_results:
    st.divider()
    er = st.session_state.enhanced_results

    st.markdown("### Enhanced Recommendations Dashboard")

    with st.container():
        col1, col2 = st.columns([1, 1])

        with col1:
            st.markdown("####  Ranking Improvement Analysis")
            m = er["metrics"]
            st.markdown(
                f"<div style='display:flex; flex-wrap:wrap; gap:8px;'>"
                f"<span class='metric-pill'>NDCG Before: <b>{m['ndcg_before']}</b></span>"
                f"<span class='metric-pill'>NDCG After: <b>{m['ndcg_after']}</b></span>"
                f"<span class='metric-pill'>Improvement: <b>{m['ndcg_improvement']}</b></span>"
                f"<span class='metric-pill'>Spearman: <b>{m['spearman_r']}</b></span>"
                f"<span class='metric-pill'>Re-ranked: <b>{m['reordered_pct']}%</b></span>"
                f"</div>",
                unsafe_allow_html=True
            )         

        with col2:
            st.markdown("####  Old vs Enhanced (Top Candidates)")
            c1, c2 = st.columns(2)
            with c1:
                st.markdown("<div class='card' style='background:#fff3e0;'>", unsafe_allow_html=True)
                st.markdown("**Old (No Feedback)**")
                for i, c in enumerate(er["old_candidates"][:10], start=1):
                    st.write(f"{i}. Candidate {c['candidate_id']} (score={c.get('final_score', 0):.3f})")
                st.markdown("</div>", unsafe_allow_html=True)
            with c2:
                st.markdown("<div class='card' style='background:#e3f2fd;'>", unsafe_allow_html=True)
                st.markdown("**Enhanced (Feedback)**")
                for i, c in enumerate(er["new_candidates"][:10], start=1):
                    st.write(f"{i}. Candidate {c['candidate_id']} (adj={c.get('final_score', 0):.3f})")
                st.markdown("</div>", unsafe_allow_html=True)

        st.markdown("---")
        st.markdown("#### Detailed Comparison")
        comp_df = er["comparison"].copy()
        cols_to_show = [
        "candidate_id",
        "name",
        "email",
        "phone",
        "experience",
        "salary",
        "resume_summary",
        "final_score_old",
        "final_score_new"
        ]
        st.dataframe(comp_df[cols_to_show].head(20), use_container_width=True)


# ============================================================
# RANKING METRICS DASHBOARD
# ============================================================

# if st.session_state.ranking_metrics:

#     st.markdown("---")
#     st.markdown("### Ranked Candidates Dashboard")

#     metrics = st.session_state.ranking_metrics

#     precision_k = metrics.get("Precision@K", 0)
#     ndcg_k = metrics.get("NDCG@K", 0)

#     st.markdown("#### Preliminary Ranking Metrics")

#     st.markdown(
#         f"""
#         <span class='metric-pill'>Precision@K: <b>{precision_k}</b></span>
#         <span class='metric-pill'>NDCG@K: <b>{ndcg_k}</b></span>
#         """,
#         unsafe_allow_html=True
#     )

#     # ---------------- METRICS HISTORY ----------------

#     st.markdown("#### Metrics History")

#     history = ranking_system.get_metrics_history()

#     if not history.empty:

#         history = history.copy()

#         history["timestamp"] = pd.to_datetime(history["timestamp"], errors="coerce")
#         history["Precision@K"] = pd.to_numeric(history["Precision@K"], errors="coerce")
#         history["NDCG@K"] = pd.to_numeric(history["NDCG@K"], errors="coerce")
#         history = history.dropna(subset=["timestamp","Precision@K","NDCG@K"])
#         history = history.sort_values("timestamp")
#         chart_df = history.set_index("timestamp")[["Precision@K","NDCG@K"]]
#         st.line_chart(chart_df)

#     else:
#         st.caption("Run ranking to see trend history.")