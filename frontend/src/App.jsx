import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RoleSelection from './components/RoleSelection';
// import UploadForm from './components/JobSeeker/UploadForm';
// import RecruiterForm from './components/Recruiter/RecruiterForm';
// import AuthForm from './components/AuthForm';
import AuthFormNew from './components/AuthFormNew';
import Home from './components/Home';
import About from './components/About';
import { auth } from './firebase';
import AnalysisPage from './components/JobSeeker/AnalysisPage';
import RecruiterPage from './components/Recruiter/RecruiterPage';
import Header from './components/Header';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const App = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        let userRole = localStorage.getItem('userRole');
        
        if (userRole) {
          console.log("Found role in localStorage:", userRole);
          setRole(userRole);
        } else {
          console.log("Role not in localStorage, fetching from Firestore");
          const userDocRef = doc(getFirestore(), "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            userRole = userDoc.data().role;
            // localStorage.setItem('userRole', userRole);
            setRole(userRole);
          }
        }
        setLoading(false);
      } else {
        // User is logged out
        setUser(null);
        setRole(null);
        localStorage.removeItem('userRole');
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Header user={user}/>

      <Routes>
        {/* Home Page: always accessible */}
        <Route path="/" element={<Home user={user} role={role}/>} />

        {/* About: always accessible */}
        <Route path="/about" element={<About />} />

        {/* Login/Signup */}
        <Route path="/auth" element={<AuthFormNew />} />

        {/* Protected Routes */}
        <Route path="/select-role" element={role === 'admin' ? <RoleSelection /> : <Navigate to="/auth" />} />
        {/* <Route path="/jobseeker" element={user ? <UploadForm /> : <Navigate to="/auth" />} /> */}
        <Route path="/jobseeker" element={role === 'jobSeeker' || role === 'admin' ? <AnalysisPage /> : <Navigate to="/auth" />} />
        {/* <Route path="/recruiter" element={user ? <RecruiterForm /> : <Navigate to="/auth" />} /> */}
        <Route path="/recruiter" element={role === 'recruiter' || role === 'admin' ? <RecruiterPage /> : <Navigate to="/auth" />} />
      </Routes>
   </>   
  );
};

export default App;
