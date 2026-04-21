import React, { useEffect, useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const AuthFormNew = () => {
  const auth = getAuth();
  const db = getFirestore(); // Initialize Firestore
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  
  // States for ALL fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [details, setDetails] = useState('');
  const [role, setRole] = useState('jobSeeker'); 
  
  const [error, setError] = useState(null);

  const [salaryType, setSalaryType] = useState("range"); 
  const [currency, setCurrency] = useState("INR");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [fixedSalary, setFixedSalary] = useState("");
  const [salaryPeriod, setSalaryPeriod] = useState("yearly");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isLogin) {
      try {
        //Sign in
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        //Fetch user document
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userRole = userDoc.data().role;
          localStorage.setItem('userRole', userRole);
          //Navigation as per role
          if (userRole === 'jobSeeker') {
            navigate('/jobseeker');
          } else if (userRole === 'recruiter') {
            navigate('/recruiter');
          } else {
            navigate('/select-role'); 
          }
        } else {
          navigate('/select-role');
        }
        
      } catch (firebaseError) {
        setError(firebaseError.message);
      }
      return;
    }

    //SIGNUP
    if (password !== retypePassword) {
      setError("Passwords do not match.");
      return;
    }
    
    try {
      //Creating user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      //Saving extra data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: email,
        fullName: fullName,
        phone: phone,
        role: role,
        details: details,
        createdAt: new Date(),

        salary: role === "jobSeeker" ? {
          type: salaryType,
          currency,
          period: salaryPeriod,
          min: salaryType === "range" ? Number(minSalary) : null,
          max: salaryType === "range" ? Number(maxSalary) : null,
          fixed: salaryType === "fixed" ? Number(fixedSalary) : null,
          negotiable: salaryType === "negotiable"
        } : null

      });
      localStorage.setItem('userRole', role);
      // Navigation as per role
      if (role === 'jobSeeker') {
        navigate('/jobseeker');
      } else {
        navigate('/recruiter');
      }
    
    } catch (firebaseError) {
      console.error("Firebase Auth Error:", firebaseError);
      let errorMessage = "An unknown error occurred.";
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          errorMessage = "This email is already in use.";
          break;
        case 'auth/weak-password':
          errorMessage = "Password should be at least 6 characters.";
          break;
        default:
          errorMessage = firebaseError.message;
      }
      setError(errorMessage);
    }
  };

  useEffect(() => {
    let userRole = localStorage.getItem('userRole');
    console.log("authform user role : ", userRole);
    if (userRole === 'jobSeeker') {
        navigate('/jobseeker');
    } else if (userRole === 'recruiter'){
      navigate('/recruiter');
    }
  }, []);
  
  const inputStyles = "w-full px-4 py-3 rounded bg-blue-800 text-white border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-blue-300";
  const labelStyles = "block text-sm font-medium text-blue-200 mb-1";
  
  return (
    <>
      
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center pt-24 pb-12 px-4">
        
        {/* === LOGIN FORM (WHEN isLogin is true) === */}
        {isLogin ? (
          <div className="bg-blue-900 p-8 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-3xl font-bold mb-6 text-center text-white">Login</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email-login" className={labelStyles}>Email</label>
                <input id="email-login" type="email" placeholder="Email" className={inputStyles} value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="password-login" className={labelStyles}>Password</label>
                <input id="password-login" type="password" placeholder="Password" className={inputStyles} value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-red-400 text-center text-sm">{error}</p>}
              <button type="submit" className="w-full bg-white text-blue-900 py-3 rounded hover:bg-blue-100 font-semibold transition text-lg">Login</button>
            </form>
            <p className="mt-6 text-center cursor-pointer text-blue-300 hover:text-blue-200 transition" onClick={() => { setIsLogin(false); setError(null); }}>
              New here? Create an account
            </p>
          </div>

        ) : (

        /* === SIGNUP FORM (WHEN isLogin is false) === */
          <div className="bg-blue-900 p-8 rounded-lg shadow-xl w-full max-w-3xl">
            <h2 className="text-3xl font-bold mb-6 text-center text-white">Create Your Account</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Role Selection */}
              <div>
                <span className={labelStyles}>I am a:</span>
                <div className="flex gap-4 mt-2">
                  <button type="button" onClick={() => setRole('jobSeeker')} className={`flex-1 py-3 rounded transition ${role === 'jobSeeker' ? 'bg-blue-600 text-white' : 'bg-blue-800 text-blue-300 hover:bg-blue-700'}`}>
                    I'm a Job Seeker
                  </button>
                  <button type="button" onClick={() => setRole('recruiter')} className={`flex-1 py-3 rounded transition ${role === 'recruiter' ? 'bg-blue-600 text-white' : 'bg-blue-800 text-blue-300 hover:bg-blue-700'}`}>
                    I'm a Recruiter
                  </button>
                </div>
              </div>

              {/* Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label htmlFor="fullName" className={labelStyles}>Full Name:</label>
                  <input id="fullName" type="text" placeholder="Your Full Name" className={inputStyles} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="email-signup" className={labelStyles}>Email:</label>
                  <input id="email-signup" type="email" placeholder="your.email@example.com" className={inputStyles} value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="phone" className={labelStyles}>Phone Number:</label>
                  <input id="phone" type="tel" placeholder="(123) 456-7890" className={inputStyles} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="password-signup" className={labelStyles}>Password:</label>
                  <input id="password-signup" type="password" placeholder="••••••••" className={inputStyles} value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="retypePassword" className={labelStyles}>Retype Password:</label>
                  <input id="retypePassword" type="password" placeholder="••••••••" className={inputStyles} value={retypePassword} onChange={(e) => setRetypePassword(e.target.value)} required />
                </div>
              </div>

              {/* Additional Details */}
                <div>
                  {role === 'jobSeeker' && (
                    <div className="space-y-4">
                      <label className={labelStyles}>Salary Expectation:</label>

                      {/* Type */}
                      <select
                        className={inputStyles}
                        value={salaryType}
                        onChange={(e) => setSalaryType(e.target.value)}
                      >
                        <option value="range">Range</option>
                        <option value="fixed">Fixed</option>
                        <option value="negotiable">Negotiable</option>
                      </select>

                      {/* Currency */}
                      <select
                        className={inputStyles}
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>

                      {/* Period */}
                      <select
                        className={inputStyles}
                        value={salaryPeriod}
                        onChange={(e) => setSalaryPeriod(e.target.value)}
                      >
                        <option value="yearly">Per Year</option>
                        <option value="monthly">Per Month</option>
                        <option value="hourly">Per Hour</option>
                      </select>

                      {/* Conditional Inputs */}
                      {salaryType === "range" && (
                        <div className="flex gap-4">
                          <input
                            type="number"
                            placeholder="Min Salary"
                            className={inputStyles}
                            value={minSalary}
                            onChange={(e) => setMinSalary(e.target.value)}
                          />
                          <input
                            type="number"
                            placeholder="Max Salary"
                            className={inputStyles}
                            value={maxSalary}
                            onChange={(e) => setMaxSalary(e.target.value)}
                          />
                        </div>
                      )}

                      {salaryType === "fixed" && (
                        <input
                          type="number"
                          placeholder="Expected Salary"
                          className={inputStyles}
                          value={fixedSalary}
                          onChange={(e) => setFixedSalary(e.target.value)}
                        />
                      )}
                    </div>
                  )}
                  
                  <label htmlFor="details" className={labelStyles}>Additional Details (Optional):</label>
                  <textarea id="details" placeholder="Tell us a bit about yourself or your company..." rows="3" className={inputStyles} value={details} onChange={(e) => setDetails(e.target.value)}></textarea>

                  
                </div>

              {error && <p className="text-red-400 text-center text-sm">{error}</p>}

              {/* Submit Button */}
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-semibold transition text-lg">
                Create Account
              </button>
            </form>
            
            <p className="mt-6 text-center cursor-pointer text-blue-300 hover:text-blue-200 transition" onClick={() => { setIsLogin(true); setError(null); }}>
              Already have an account? Log In
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default AuthFormNew;