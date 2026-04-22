import React, { useState } from 'react';
import axios from 'axios';

const RecruiterModule = () => {
    const [jdText, setJdText] = useState("");
    const [jdId, setJdId] = useState(null);
    const [topK, setTopK] = useState(20);
    const [minExp, setMinExp] = useState(0);
    const [maxSalary, setMaxSalary] = useState(150000);
    const [loading, setLoading] = useState(false);

    const [rankedCandidates, setRankedCandidates] = useState([]);
    const [enhancedResults, setEnhancedResults] = useState(null);
    const [ratings, setRatings] = useState({});

    const handleJDUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('resume', file); 
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/jobseeker/extract', formData);
            setJdText(res.data.text);
            setJdId(res.data.resume_id);
            alert("JD uploaded successfully!");
        } catch(err) {
            console.error(err);
            alert("Error uploading JD");
        } finally {
            setLoading(false);
        }
    };

    const findCandidates = async () => {
        if (!jdText.trim()) {
            alert("Please enter Job Description");
            return;
        }

        // Generate a pseudo id if none exists from upload
        const currentJdId = jdId || Math.abs(jdText.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)) % 100000000;
        setJdId(currentJdId);

        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/recruiter/rank', {
                jd_text: jdText,
                top_k: topK,
                min_exp: minExp,
                max_salary: maxSalary,
                jd_id: currentJdId
            });
            setRankedCandidates(res.data.candidates || []);
            setEnhancedResults(null);
        } catch(err) {
            console.error(err);
            alert("Error finding candidates");
        } finally {
            setLoading(false);
        }
    };

    const enhanceFeedback = async () => {
        if (!jdText.trim()) return;
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/recruiter/enhance', {
                jd_text: jdText,
                jd_id: jdId,
                top_k: topK,
                min_exp: minExp,
                max_salary: maxSalary
            });
            setEnhancedResults(res.data);
        } catch(err) {
            console.error(err);
            alert("Error enhancing feedback");
        } finally {
            setLoading(false);
        }
    };

    const submitRating = async (candidateId, index) => {
        const rating = ratings[candidateId] || 3;
        try {
            await axios.post('http://localhost:5000/api/recruiter/rate', {
                jd_id: jdId,
                candidate_id: candidateId,
                rating: rating
            });
            alert(`You rated Candidate ${candidateId} as ${rating}/5`);
            findCandidates(); // Re-rank
        } catch(err) {
            console.error(err);
            alert("Error submitting rating");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8 pt-24">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
                {/* LEFT COLUMN */}
                <div className="md:w-1/4 bg-white p-6 rounded-xl shadow-md border border-gray-200 h-fit">
                    <h4 className="font-bold text-lg mb-4 text-gray-800">Ranking Filters</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Top-K Candidates</label>
                            <select className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white" value={topK} onChange={e => setTopK(parseInt(e.target.value))}>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Minimum Experience (Yrs)</label>
                            <input type="number" min="0" max="20" className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={minExp} onChange={e => setMinExp(parseInt(e.target.value) || 0)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Max Salary Allowed </label>
                            <input type="number" min="0" step="5000" className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={maxSalary} onChange={e => setMaxSalary(parseInt(e.target.value) || 0)} />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="md:w-3/4 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Job Description</h3>
                        <textarea
                            className="w-full border border-gray-300 rounded-md p-3 mb-4 h-48 resize-y"
                            placeholder="Paste Job Description"
                            value={jdText}
                            onChange={e => setJdText(e.target.value)}
                        />

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Or Upload JD PDF (PDF only)</label>
                            <input type="file" accept=".pdf" onChange={handleJDUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        </div>

                        <div className="flex gap-4">
                            <button disabled={loading} onClick={findCandidates} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-bold disabled:opacity-50 transition">
                                Find Best Candidates
                            </button>
                            <button disabled={loading || !jdText.trim()} onClick={enhanceFeedback} className="flex-1 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 py-3 px-4 rounded-lg font-bold disabled:opacity-50 transition">
                                Enhance with AI Feedback
                            </button>
                        </div>

                        {loading && <p className="mt-4 text-center text-blue-600 font-medium">Processing...</p>}
                    </div>

                    {/* Candidates List */}
                    {rankedCandidates.length > 0 && !enhancedResults && (
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-6">Candidates List</h3>
                            <div className="space-y-6">
                                {rankedCandidates.map((cand, idx) => (
                                    <div key={cand.candidate_id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="text-lg font-bold text-gray-900">Candidate {cand.candidate_id} — {cand.name || 'Unknown'}</h4>
                                            <span className="text-sm font-medium text-gray-600">Exp: {cand.experience} yrs | Salary: {cand.salary?.toLocaleString() || 0}</span>
                                        </div>

                                        <div className="mb-4">
                                            <label className="text-xs text-gray-500 block mb-1">Match Score</label>
                                            <input type="range" min="0" max="100" value={(cand.final_score * 100).toFixed(0)} disabled className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-not-allowed" />
                                        </div>

                                        <details className="mb-4">
                                            <summary className="cursor-pointer text-blue-600 font-medium">Details</summary>
                                            <div className="mt-2 text-sm text-gray-700 space-y-2">
                                                <p><strong>Phone:</strong> {cand.phone || 'Unknown'} | <strong>Email:</strong> {cand.email || 'Unknown'}</p>
                                                <p><strong>Resume Summary:</strong> {cand.resume_summary}</p>
                                            </div>
                                        </details>

                                        <div className="flex items-center gap-4 mt-4">
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-500 block mb-1">Your Rating</label>
                                                <input type="range" min="1" max="5" step="1"
                                                    value={ratings[cand.candidate_id] || 3}
                                                    onChange={e => setRatings({...ratings, [cand.candidate_id]: parseInt(e.target.value)})}
                                                    className="w-full"
                                                />
                                            </div>
                                            <button onClick={() => submitRating(cand.candidate_id, idx)} className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-md font-medium text-sm">
                                                Submit Feedback
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Enhanced Dashboard */}
                    {enhancedResults && (
                        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8">
                            <h3 className="text-3xl font-extrabold text-blue-900 mb-8 tracking-tight">Enhanced Recommendations Dashboard</h3>

                            <div className="grid md:grid-cols-2 gap-8 mb-2">
                                {/* LEFT: Ranking Improvement Analysis */}
                                <div>
                                    <h4 className="font-extrabold text-xl mb-5 text-blue-900 tracking-tight">Ranking Improvement Analysis</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                            <div className="w-9 h-9 rounded-lg bg-blue-200/70 flex items-center justify-center shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 17 9 11 13 15 21 7"></polyline><polyline points="14 7 21 7 21 14"></polyline></svg>
                                            </div>
                                            <span className="text-sm font-bold text-blue-900">NDCG Before: {enhancedResults.metrics.ndcg_before.toFixed(4)}</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                            <div className="w-9 h-9 rounded-lg bg-blue-200/70 flex items-center justify-center shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 17 9 11 13 15 21 7"></polyline><polyline points="14 7 21 7 21 14"></polyline></svg>
                                            </div>
                                            <span className="text-sm font-bold text-blue-900">NDCG After: {enhancedResults.metrics.ndcg_after.toFixed(4)}</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                            <div className="w-9 h-9 rounded-lg bg-blue-200/70 flex items-center justify-center shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                                            </div>
                                            <span className="text-sm font-bold text-blue-900">Improvement: {enhancedResults.metrics.ndcg_improvement.toFixed(4)}</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                            <div className="w-9 h-9 rounded-lg bg-blue-200/70 flex items-center justify-center shrink-0">
                                                <span className="text-blue-800 font-extrabold text-lg leading-none">Σ</span>
                                            </div>
                                            <span className="text-sm font-bold text-blue-900">Spearman: {enhancedResults.metrics.spearman_r.toFixed(4)}</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 col-span-2 w-fit">
                                            <div className="w-9 h-9 rounded-lg bg-blue-200/70 flex items-center justify-center shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path><path d="M20.49 15A9 9 0 0 1 5.64 18.36L1 14"></path></svg>
                                            </div>
                                            <span className="text-sm font-bold text-blue-900">Re-ranked: {enhancedResults.metrics.reordered_pct}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT: Old vs Enhanced */}
                                <div>
                                    <h4 className="font-extrabold text-xl mb-5 text-blue-900 tracking-tight">Old vs Enhanced (Top Candidates)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Old column */}
                                        <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                                            <div className="bg-blue-900 px-4 py-3 flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                                <p className="font-bold text-white text-sm tracking-tight">Old (No Feedback)</p>
                                            </div>
                                            <ul className="p-4 space-y-3">
                                                {enhancedResults.old_candidates.slice(0, 10).map((c, i) => (
                                                    <li key={i} className="flex items-start gap-3">
                                                        <span className="w-6 h-6 rounded-md bg-blue-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                                                        <div className="leading-tight">
                                                            <p className="text-sm font-bold text-blue-900">Candidate {c.candidate_id}</p>
                                                            <p className="text-xs text-blue-700/80">(score={c.final_score?.toFixed(3)})</p>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Enhanced column */}
                                        <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                                            <div className="bg-blue-900 px-4 py-3 flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                                <p className="font-bold text-white text-sm tracking-tight">Enhanced (Feedback)</p>
                                            </div>
                                            <ul className="p-4 space-y-3">
                                                {enhancedResults.new_candidates.slice(0, 10).map((c, i) => (
                                                    <li key={i} className="flex items-start gap-3">
                                                        <span className="w-6 h-6 rounded-md bg-blue-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                                                        <div className="leading-tight">
                                                            <p className="text-sm font-bold text-blue-900">Candidate {c.candidate_id}</p>
                                                            <p className="text-xs text-blue-700/80">(adj={c.final_score?.toFixed(3)})</p>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecruiterModule;
