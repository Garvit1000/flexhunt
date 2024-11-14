import React, { useState } from 'react';
import { UserIcon, BriefcaseIcon,X } from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '../firebase';
const SignUpSection = () => {
  const [userType, setUserType] = useState(null);
  const [error, setError] = useState(null);
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      localStorage.setItem('userRole', userType); 
      closeModal();
    } catch (error) {
      setError("Google sign-in failed. Please try again.");
      console.error("Google sign-in error: ", error);
    }
  };

  return (
    <section className="my-16 bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md rounded-lg p-8 text-white">
      <h2 className="text-3xl font-bold text-center mb-8">Join Us Today</h2>
      <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-8">
        <button
          onClick={() => setUserType('jobseeker')}
          className={`flex items-center justify-center px-6 py-3 border-2 ${
            userType === 'jobseeker' ? 'border-white bg-white bg-opacity-20' : 'border-white border-opacity-50'
          } rounded-md transition duration-300 hover:bg-white hover:bg-opacity-20`}
        >
          <UserIcon className="w-6 h-6 mr-2" />
          <span className="text-lg font-medium">Job Seeker</span>
        </button>
        <button
          onClick={() => setUserType('recruiter')}
          className={`flex items-center justify-center px-6 py-3 border-2 ${
            userType === 'recruiter' ? 'border-white bg-white bg-opacity-20' : 'border-white border-opacity-50'
          } rounded-md transition duration-300 hover:bg-white hover:bg-opacity-20`}
        >
          <BriefcaseIcon className="w-6 h-6 mr-2" />
          <span className="text-lg font-medium">Recruiter</span>
        </button>
      </div>
      {userType && (
        <div className="mt-8 text-center">
          <a
             onClick={handleGoogleSignIn}
             disabled={!userType}
            className="inline-block px-6 py-3 bg-white text-indigo-600 font-medium rounded-md hover:bg-opacity-90 transition duration-300"
          >
            Sign Up as {userType === 'jobseeker' ? 'Job Seeker' : 'Recruiter'}
          </a>
        </div>
      )}
    </section>
  );
};

export default SignUpSection;