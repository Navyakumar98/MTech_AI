from recruiter_model import RecruiterRankingSystem

system = RecruiterRankingSystem("data/resumes.csv")
results, metrics = system.rank_candidates("Looking for a Python backend developer with Django experience.", top_k=5)
print("Metrics:", metrics)
