import React, { useState } from 'react';
import axios from 'axios';

const JobseekerModule = () => {
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeText, setResumeText] = useState("");
    const [resumeId, setResumeId] = useState(null);
    const [loading, setLoading] = useState(false);

    // User Profile fields
    const [userLocation, setUserLocation] = useState("Berlin Germany");
    const [userSalary, setUserSalary] = useState("220000");
    const [userExperience, setUserExperience] = useState("3");

    // Weights
    const [locationWeight, setLocationWeight] = useState(0.3);
    const [salaryWeight, setSalaryWeight] = useState(0.4);
    const [experienceWeight, setExperienceWeight] = useState(0.3);

    const [jobResults, setJobResults] = useState([]);
    const [enhancedResults, setEnhancedResults] = useState(null);
    const [ratings, setRatings] = useState({});

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setResumeFile(file);

        const formData = new FormData();
        formData.append('resume', file);

        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/jobseeker/extract', formData);
            setResumeText(res.data.text);
            setResumeId(res.data.resume_id);
            setJobResults([]);
            setEnhancedResults(null);
            alert("Resume uploaded successfully!");
        } catch(err) {
            console.error(err);
            alert("Error uploading resume");
        } finally {
            setLoading(false);
        }
    };

    const findJobs = async () => {
        if (!resumeText) return;
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/jobseeker/recommend', {
                resume_text: resumeText,
                location_weight: locationWeight,
                salary_weight: salaryWeight,
                experience_weight: experienceWeight,
                user_location: userLocation,
                user_salary: userSalary,
                user_experience: userExperience
            });
            setJobResults(res.data.recommended_jobs || []);
            setEnhancedResults(null);
        } catch(err) {
            console.error(err);
            alert("Error finding jobs");
        } finally {
            setLoading(false);
        }
    };

    const enhanceFeedback = async () => {
        if (!resumeText) return;
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/jobseeker/enhance', {
                resume_text: resumeText
            });
            setEnhancedResults(res.data);
        } catch(err) {
            console.error(err);
            alert("Error enhancing feedback");
        } finally {
            setLoading(false);
        }
    };

    const submitRating = async (jobId, index) => {
        const rating = ratings[jobId] || 3;
        try {
            await axios.post('http://localhost:5000/api/jobseeker/rate', {
                resume_id: resumeId,
                job_id: jobId,
                rating: rating
            });
            alert(`You rated Job ${index + 1} as ${rating}/5`);
            findJobs(); // Re-run recommendation after rating
        } catch(err) {
            console.error(err);
            alert("Error submitting rating");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8 pt-24">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
                {/* LEFT COLUMN */}
                <div className="md:w-1/3 bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <h4 className="font-bold text-lg mb-4 text-gray-800">Your Profile</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Your Location</label>
                            <input className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={userLocation} onChange={e => setUserLocation(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Desired Salary</label>
                            <input className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={userSalary} onChange={e => setUserSalary(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                            <input className="mt-1 block w-full border border-gray-300 rounded-md p-2" value={userExperience} onChange={e => setUserExperience(e.target.value)} />
                        </div>
                    </div>

                    <hr className="my-6 border-gray-300" />

                    <h4 className="font-bold text-lg mb-4 text-gray-800">Factor Weights</h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Location: {locationWeight}</label>
                            <input type="range" min="0" max="1" step="0.01" className="w-full" value={locationWeight} onChange={e => setLocationWeight(parseFloat(e.target.value))} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Salary: {salaryWeight}</label>
                            <input type="range" min="0" max="1" step="0.01" className="w-full" value={salaryWeight} onChange={e => setSalaryWeight(parseFloat(e.target.value))} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Experience: {experienceWeight}</label>
                            <input type="range" min="0" max="1" step="0.01" className="w-full" value={experienceWeight} onChange={e => setExperienceWeight(parseFloat(e.target.value))} />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="md:w-2/3 space-y-6">
                    <div className="bg-blue-50 border-2 border-dashed border-blue-500 rounded-xl p-8 text-center">
                        <p className="text-gray-700 font-medium mb-4">Upload your resume (PDF only)</p>
                        <input type="file" accept=".pdf" onChange={handleUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
                        {loading && <p className="mt-4 text-blue-600">Processing...</p>}
                    </div>

                    <div className="flex gap-4">
                        <button disabled={!resumeText || loading} onClick={findJobs} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-bold disabled:opacity-50">
                            Find My Perfect Jobs
                        </button>
                        <button disabled={!resumeText || loading} onClick={enhanceFeedback} className="flex-1 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 py-3 px-4 rounded-lg font-bold disabled:opacity-50">
                            Enhance with AI Feedback
                        </button>
                    </div>

                    {/* Job Results */}
                    {jobResults.length > 0 && !enhancedResults && (
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-6">Recommended Jobs for You</h3>
                            <div className="space-y-6">
                                {jobResults.slice(0, 20).map((job, idx) => (
                                    <div key={job['Job Id'] || idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="text-lg font-bold text-gray-900">{job.position} — {job.workplace}</h4>
                                            <span className="text-sm font-medium text-gray-600 capitalize">{job.working_mode}</span>
                                        </div>

                                        <div className="mb-4">
                                            <label className="text-xs text-gray-500">Match Score</label>
                                            <input type="range" min="0" max="1" step="0.01" value={job.adjusted_score || job.similarity || 0} disabled className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-not-allowed" />
                                        </div>

                                        <details className="mb-4">
                                            <summary className="cursor-pointer text-blue-600 font-medium">Details</summary>
                                            <div className="mt-2 text-sm text-gray-700 space-y-2">
                                                <p><strong>Duties:</strong> {job.job_role_and_duties?.substring(0, 250)}...</p>
                                                <p><strong>Skills Required:</strong> {job.requisite_skill}</p>
                                                {job.matched_skills && (
                                                    <p><strong>Matched Skills:</strong> {job.matched_skills}</p>
                                                )}
                                            </div>
                                        </details>

                                        <div className="flex items-center gap-4 mt-4">
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-500 block mb-1">Your Rating</label>
                                                <input type="range" min="1" max="5" step="1"
                                                    value={ratings[job['Job Id']] || 3}
                                                    onChange={e => setRatings({...ratings, [job['Job Id']]: parseInt(e.target.value)})}
                                                    className="w-full"
                                                />
                                            </div>
                                            <button onClick={() => submitRating(job['Job Id'], idx)} className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-md font-medium text-sm">
                                                Submit Feedback
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Enhanced Results Dashboard */}
                    {enhancedResults && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6">Enhanced Recommendations Dashboard</h3>

                            <div className="grid md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h4 className="font-bold text-lg mb-4">Ranking Consistency Evaluation</h4>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">NDCG@20: {enhancedResults.metrics.ndcg_at_k.toFixed(4)}</span>
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">Spearman-R: {enhancedResults.metrics.spearman_r.toFixed(4)}</span>
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">Reordered: {enhancedResults.metrics.reordered_pct}%</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-lg mb-4">Old vs Enhanced (Top 10)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-orange-50 p-4 rounded-lg">
                                            <p className="font-bold mb-2">Old (No Feedback)</p>
                                            <ul className="text-sm space-y-1">
                                                {enhancedResults.old_jobs.slice(0, 10).map((j, i) => (
                                                    <li key={i}>{i+1}. {j.position} (sim={j.similarity?.toFixed(3)})</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <p className="font-bold mb-2">Enhanced (Feedback)</p>
                                            <ul className="text-sm space-y-1">
                                                {enhancedResults.new_jobs.slice(0, 10).map((j, i) => (
                                                    <li key={i}>{i+1}. {j.position} (adj={j.adjusted_score?.toFixed(3)})</li>
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

export default JobseekerModule;
