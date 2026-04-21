import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'; // Import getAuth
import { useNavigate } from 'react-router-dom';

const AuthForm = () => {
  const auth = getAuth(); // Initialize auth here
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState(null); // State for displaying errors

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // After successful login/signup, navigate to the role selection page
      navigate('/select-role'); // Assuming this route exists for role selection
    } catch (firebaseError) {
      console.error("Firebase Auth Error:", firebaseError);
      // Display a more user-friendly error message
      let errorMessage = "An unknown error occurred.";
      switch (firebaseError.code) {
        case 'auth/invalid-email':
          errorMessage = "Invalid email address.";
          break;
        case 'auth/user-disabled':
          errorMessage = "This user account has been disabled.";
          break;
        case 'auth/user-not-found':
          errorMessage = "No user found with this email.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password.";
          break;
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

  return (
    <>
      
      {/* Main container: white background, centered content, top padding */}
      <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center pt-24 pb-12 px-4">
        {/* Auth card: dark blue background, rounded, shadow */}
        <div className="bg-blue-900 p-8 rounded-lg shadow-xl w-full max-w-lg">
          <h2 className="text-3xl font-bold mb-6 text-center text-white">{isLogin ? 'Login' : 'Signup'}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="sr-only">Email</label> {/* Accessible label for screen readers */}
              <input
                id="email"
                type="email"
                placeholder="Email"
                className="w-full px-4 py-3 rounded bg-blue-800 text-white border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-blue-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            {/* Password Input */}
            <div>
              <label htmlFor="password" className="sr-only">Password</label> {/* Accessible label for screen readers */}
              <input
                id="password"
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3 rounded bg-blue-800 text-white border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-blue-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            {/* Display Error Message */}
            {error && <p className="text-red-400 text-center text-sm">{error}</p>}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-white text-blue-900 py-3 rounded hover:bg-blue-100 font-semibold transition text-lg"
            >
              {isLogin ? 'Login' : 'Signup'}
            </button>
          </form>

          {/* Toggle Login/Signup Link */}
          <p
            className="mt-6 text-center cursor-pointer text-blue-300 hover:text-blue-200 transition"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null); // Clear error when switching form type
            }}
          >
            {isLogin ? 'New here? Create an account' : 'Already have an account? Login'}
          </p>
        </div>
      </div>
    </>
  );
};

export default AuthForm;