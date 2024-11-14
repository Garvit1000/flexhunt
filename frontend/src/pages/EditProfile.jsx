import { Link } from 'react-router-dom'
import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Ensure correct path
import { useAuth } from '../components/AuthContext';
import { User, Mail, Phone, Book, Briefcase, MapPin, FileText, Code, ArrowLeft } from 'lucide-react'
import { GlobeAltIcon, LinkIcon } from '@heroicons/react/24/outline'
const EditProfile = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    mobile: '',
    pronouns: '',
    college: '',
    company: '',
    companyDetails: '',
    about: '',
    skills: '',
    github: '',
    linkedin: '',
    role: 'job_seeker', // Default role
  });

  // Fetch user data from Firebase
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, userData);
      localStorage.setItem('role', userData.role); // Store updated role
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };


  return (
    <div className="container mx-auto px-4 py-8">
    <div className="bg-white rounded-lg shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
          <Link to="/profile" className="text-white hover:text-indigo-100 transition duration-300 flex items-center">
            <ArrowLeft size={20} className="mr-2" />
            Back to Profile
          </Link>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="firstName"
                id="firstName"
                value={userData.firstName}
                onChange={handleChange}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="First Name"
              />
            </div>
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="lastName"
                id="lastName"
                value={userData.lastName}
                onChange={handleChange}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Last Name"
              />
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="username"
              id="username"
              value={userData.username}
              onChange={handleChange}
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Username"
            />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              id="email"
              value={userData.email}
              disabled
              className="bg-gray-100 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="you@example.com"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">Mobile</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                name="mobile"
                id="mobile"
                value={userData.mobile}
                onChange={handleChange}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Mobile Number"
              />
            </div>
          </div>
          <div>
            <label htmlFor="pronouns" className="block text-sm font-medium text-gray-700">Pronouns</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="pronouns"
                id="pronouns"
                value={userData.pronouns}
                onChange={handleChange}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Pronouns"
              />
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
          <select
            name="role"
            id="role"
            value={userData.role}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="job_seeker">Job Seeker</option>
            <option value="recruiter">Recruiter</option>
          </select>
        </div>
        {userData.role === 'recruiter' ? (
          <>
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company Name</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="company"
                  id="company"
                  value={userData.company}
                  onChange={handleChange}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Company Name"
                />
              </div>
            </div>
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700">Position</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="position"
                  id="position"
                  value={userData.position}
                  onChange={handleChange}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Position"
                />
              </div>
            </div>
            <div>
              <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">Company Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="companyAddress"
                  id="companyAddress"
                  value={userData.companyAddress}
                  onChange={handleChange}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Company Address"
                />
              </div>
            </div>
          </>
        ) : (
          <div>
            <label htmlFor="college" className="block text-sm font-medium text-gray-700">College</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Book className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="college"
                id="college"
                value={userData.college}
                onChange={handleChange}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="College Name"
              />
            </div>
          </div>
        )}
        <div>
          <label htmlFor="about" className="block text-sm font-medium text-gray-700">About</label>
          <div className="mt-1">
            <textarea
              id="about"
              name="about"
              rows={4}
              value={userData.about}
              onChange={handleChange}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Tell us about yourself"
            />
          </div>
        </div>
        <div>
          <label htmlFor="skills" className="block text-sm font-medium text-gray-700">Skills</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Code className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="skills"
              id="skills"
              value={userData.skills}
              onChange={handleChange}
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Skills (comma separated)"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <label htmlFor="github" className="block text-sm font-medium text-gray-700">GitHub</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <GlobeAltIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="github"
                id="github"
                value={userData.github}
                onChange={handleChange}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="GitHub Username"
              />
            </div>
          </div>
          <div>
            <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700">LinkedIn</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="linkedin"
                id="linkedin"
                value={userData.linkedin}
                onChange={handleChange}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="LinkedIn Profile URL"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Update Profile
          </button>
        </div>
      </form>
    </div>
  </div>
)
}

export default EditProfile