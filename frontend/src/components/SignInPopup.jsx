import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';

const SignInPopup = ({ closeModal, setRole }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleGoogleAuth = async () => {
    try {
      if (!isLogin && !selectedRole) {
        setError("Please select your role before signing up");
        return;
      }

      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email;
      
      const existingRole = localStorage.getItem(`role_${userEmail}`);
      
      if (existingRole && isLogin) {
        // Login flow for existing users
        setRole(existingRole);
        localStorage.setItem('lastUserEmail', userEmail);
        setSuccessMessage(`Welcome back! Signing you in as ${existingRole}`);
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else if (existingRole && !isLogin) {
        // If trying to signup with an existing account
        setError("Account already exists. Please use login instead.");
      } else if (!existingRole && !isLogin) {
        // Signup flow for new users
        localStorage.setItem(`role_${userEmail}`, selectedRole);
        localStorage.setItem('lastUserEmail', userEmail);
        setRole(selectedRole);
        setSuccessMessage(`Successfully registered as ${selectedRole}`);
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        // Login attempt with non-existing account
        setError("Account not found. Please signup first.");
      }
    } catch (error) {
      setError("Google authentication failed. Please try again.");
      console.error("Google auth error: ", error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full">
          <p className="text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="bg-white rounded-lg max-w-4xl w-full relative flex">
        {/* Left Side - Image */}
        <div className="hidden md:block w-1/2 bg-blue-600 rounded-l-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 opacity-90" />
          <div className="relative p-8 flex flex-col h-full justify-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {isLogin ? 'Welcome Back!' : 'Join Our Community'}
            </h2>
            <p className="text-blue-100 text-lg">
              {isLogin 
                ? 'Sign in to access your account and continue your journey with us.' 
                : 'Create an account to start your journey and explore opportunities.'}
            </p>
          </div>
          {/* Decorative circles */}
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full border border-blue-400 opacity-20" />
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full border border-blue-400 opacity-20" />
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full md:w-1/2 p-8">
          <button
            onClick={closeModal}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {isLogin ? 'Login' : 'Sign Up'}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {isLogin ? 'Access your account' : 'Create your account'}
              </p>
            </div>

            {!isLogin && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">Select your role:</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedRole('jobseeker')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedRole === 'jobseeker'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-medium">Job Seeker</div>
                      <div className="text-xs text-gray-500">Find opportunities</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedRole('recruiter')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedRole === 'recruiter'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-medium">Recruiter</div>
                      <div className="text-xs text-gray-500">Hire talent</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleGoogleAuth}
              className="w-full py-2.5 px-4 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 font-medium flex items-center justify-center gap-3 shadow-sm transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="text-center text-sm">
              <p className="text-gray-600">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setSelectedRole(null);
                    setError(null);
                  }}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {isLogin ? 'Sign Up' : 'Login'}
                </button>
              </p>
            </div>
          </div>

          {successMessage && (
            <Alert className="mt-4 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mt-4 bg-red-50 border-red-200">
              <AlertDescription className="text-red-600">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SignInPopup;