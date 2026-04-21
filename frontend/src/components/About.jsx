import React from 'react';

const About = () => {
  return (
    <>
      
      <div className="min-h-screen bg-white text-gray-900 px-6 flex flex-col items-center justify-center pt-20 pb-12"> 

        <h1 className="text-4xl font-extrabold mb-6 text-center"> 
          About JobFusion
        </h1>

        <p className="max-w-3xl text-lg text-center leading-8">
          <span className="font-semibold text-blue-800">JobFusion </span>
          is an AI-powered platform designed to simplify your job search and recruitment process. Whether you're a
          job seeker looking for personalized opportunities or a recruiter trying to shortlist the best candidates,
          JobFusion offers:
        </p>

        <ul className="mt-8 list-disc max-w-2xl text-left space-y-4 pl-6 text-gray-800">
          <li><span className="text-blue-600 font-semibold">Resume Analysis:</span> Get your resume evaluated and scored using ATS algorithms.</li>
          <li><span className="text-blue-600 font-semibold">Job Suggestions:</span> Receive job recommendations based on your resume.</li>
          <li><span className="text-blue-600 font-semibold">Recruiter Tools:</span> Upload job descriptions and resumes to get the top candidates automatically.</li>
        </ul>

        <p className="mt-12 text-center text-blue-600 font-medium">
          Engineered with ❤ to shape the future of hiring
        </p>
      </div>
    </>
  );
};

export default About;