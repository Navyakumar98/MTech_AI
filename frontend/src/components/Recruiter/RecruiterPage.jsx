import React, { useState } from 'react';

const RecruiterPage = () => {
  const [jd, setJd] = useState('');
  const [resumes, setResumes] = useState([]);
  const [numCandidates, setNumCandidates] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Added for success message

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null); // Clear previous success messages

    if (!jd.trim()) {
      setError("Please enter a job description.");
      setLoading(false);
      return;
    }
    if (resumes.length === 0) {
      setError("Please upload at least one resume.");
      setLoading(false);
      return;
    }
    if (numCandidates < 1) {
      setError("Number of candidates must be at least 1.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('job_description', jd);
    formData.append('num_candidates', numCandidates);
    for (let i = 0; i < resumes.length; i++) {
      formData.append('resumes', resumes[i]);
    }

    try {
      const response = await fetch('http://localhost:5000/recruiter', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'shortlisted_resumes.zip');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSuccess("Shortlisted resumes downloaded successfully!");
      } else {
        const errorData = await response.json(); // Assuming backend sends JSON for errors
        setError(errorData.message || "Failed to shortlist candidates. Please try again.");
      }
    } catch (err) {
      console.error("Error during shortlisting:", err);
      setError("An unexpected error occurred. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      
      <div className="min-h-screen bg-gray-100 flex items-center justify-center pt-24 pb-12 px-4">
        {/* Main form container, styled to look like a card */}
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Recruiter Tools</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Description */}
            <div>
              <label htmlFor="jobDescription" className="block text-md font-semibold text-gray-700 mb-2">
                Job Description
              </label>
              <textarea
                id="jobDescription"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Enter Job Description"
                rows="6"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 resize-y"
              ></textarea>
            </div>

            {/* Upload Resumes */}
            <div>
              <label htmlFor="uploadResumes" className="block text-md font-semibold text-gray-700 mb-2">
                Upload Resumes
              </label>
              <input
                id="uploadResumes"
                type="file"
                multiple
                accept=".pdf,.docx" // Specify accepted file types
                onChange={(e) => setResumes(Array.from(e.target.files))} // Convert FileList to Array
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100 border border-gray-300 rounded-md cursor-pointer"
              />
              {resumes.length > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {resumes.map(file => file.name).join(', ')}
                </p>
              )}
            </div>

            {/* Number of Candidates */}
            <div>
              <label htmlFor="numCandidates" className="block text-md font-semibold text-gray-700 mb-2">
                Number of Candidates
              </label>
              <input
                id="numCandidates"
                type="number"
                min="1" // Minimum value
                value={numCandidates}
                onChange={(e) => setNumCandidates(parseInt(e.target.value, 10))}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition duration-300"
              disabled={loading}
            >
              {loading ? "Shortlisting..." : "Shortlist Candidates"}
            </button>

            {/* Messages */}
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            {success && <p className="text-green-600 text-center mt-4">{success}</p>}
          </form>
        </div>
      </div>
    </>
  );
};

export default RecruiterPage;