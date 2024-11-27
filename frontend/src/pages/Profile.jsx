import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, MapPin, Briefcase, GraduationCap, Edit2, Github, Linkedin, Twitter } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          
          // Check if essential profile data is missing
          if (!data.firstName || !data.lastName || !data.role || 
              (data.role === 'job_seeker' && !data.college) || 
              (data.role === 'recruiter' && (!data.company || !data.position))) {
            setError('incomplete_profile');
            return;
          }

          // Ensure skills is an array
          const skillsArray = Array.isArray(data.skills)
            ? data.skills
            : data.skills?.split(',').map(skill => skill.trim()) ?? [];

          setUserData({ ...data, skills: skillsArray });
        } else {
          setError('incomplete_profile');
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        setError('fetch_error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);
  
  const handleSocialClick = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error === 'incomplete_profile') {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <Alert>
          <AlertTitle>Complete Your Profile</AlertTitle>
          <AlertDescription className="mt-2">
            Please complete your profile to access all features of FlexHunt.
          </AlertDescription>
          <Button 
            onClick={() => navigate('/edit-profile')}
            className="mt-4 bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Complete Profile
          </Button>
        </Alert>
      </div>
    );
  }

  if (error === 'fetch_error') {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was an error loading your profile. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto px-4 py-8 mt-16">
        <Alert>
          <AlertTitle>Profile Not Found</AlertTitle>
          <AlertDescription className="mt-2">
            We couldn't find your profile. Please set up your profile to continue.
          </AlertDescription>
          <Button 
            onClick={() => navigate('/edit-profile')}
            className="mt-4 bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Set Up Profile
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6">
          <div className="flex items-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-indigo-600 text-4xl font-bold mr-6">
              {userData.firstName?.[0]}{userData.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{userData.firstName} {userData.lastName}</h1>
              <p className="text-indigo-100">@{userData.username} • {userData.pronouns}</p>
              <p className="text-indigo-100 mt-1">
                {userData.role === 'job_seeker' ? (
                  <span className="flex items-center">
                    <GraduationCap size={16} className="mr-1" /> {userData.college}
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Briefcase size={16} className="mr-1" /> {userData.position} at {userData.company}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {userData.companyAddress && (
            <div className="flex items-center text-gray-600 mb-4">
              <MapPin size={20} className="mr-2" />
              <span>{userData.companyAddress}</span>
            </div>
          )}

          {userData.about && (
            <>
              <h2 className="text-xl font-semibold mb-2">About</h2>
              <p className="text-gray-600 mb-6">{userData.about}</p>
            </>
          )}

          {userData.skills?.length > 0 && (
            <>
              <h2 className="text-xl font-semibold mb-2">Skills</h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {userData.skills.map((skill, index) => (
                  <span key={index} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </>
          )}

          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              {userData.github && (
                <button onClick={() => handleSocialClick(userData.github)} className="text-gray-400 hover:text-indigo-600">
                  <Github size={24} />
                </button>
              )}
              {userData.linkedin && (
                <button onClick={() => handleSocialClick(userData.linkedin)} className="text-gray-400 hover:text-indigo-600">
                  <Linkedin size={24} />
                </button>
              )}
            </div>
            <Link to="/edit-profile" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-300 flex items-center">
              <Edit2 size={18} className="mr-2" />
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center space-x-4">
        <Link to="/job-page" className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition duration-300 flex items-center">
          <Briefcase size={20} className="mr-2" />
          View Jobs
        </Link>
        <Link to="https://flex-community.vercel.app/" className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition duration-300 flex items-center">
          <User size={20} className="mr-2" />
          Community Forum
        </Link>
      </div>
    </div>
  );
};

export default Profile;
