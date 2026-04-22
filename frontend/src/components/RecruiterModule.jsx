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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6">Enhanced Recommendations Dashboard</h3>

                            <div className="grid md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h4 className="font-bold text-lg mb-4">Ranking Improvement Analysis</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">NDCG Before: {enhancedResults.metrics.ndcg_before.toFixed(4)}</span>
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">NDCG After: {enhancedResults.metrics.ndcg_after.toFixed(4)}</span>
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">Improvement: {enhancedResults.metrics.ndcg_improvement.toFixed(4)}</span>
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">Spearman: {enhancedResults.metrics.spearman_r.toFixed(4)}</span>
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">Re-ranked: {enhancedResults.metrics.reordered_pct}%</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-lg mb-4">Old vs Enhanced (Top Candidates)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-orange-50 p-4 rounded-lg">
                                            <p className="font-bold mb-2">Old (No Feedback)</p>
                                            <ul className="text-sm space-y-1">
                                                {enhancedResults.old_candidates.slice(0, 10).map((c, i) => (
                                                    <li key={i}>{i+1}. Candidate {c.candidate_id} (score={c.final_score?.toFixed(3)})</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <p className="font-bold mb-2">Enhanced (Feedback)</p>
                                            <ul className="text-sm space-y-1">
                                                {enhancedResults.new_candidates.slice(0, 10).map((c, i) => (
                                                    <li key={i}>{i+1}. Candidate {c.candidate_id} (adj={c.final_score?.toFixed(3)})</li>
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
