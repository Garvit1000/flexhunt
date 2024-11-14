import React, { useEffect, useState } from 'react';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthContext';
import JobCard from './JobCard';
import JobDetailsPage from './JobDetailsPage';
import { Search, Briefcase, MapPin } from 'lucide-react';

const Jobpage = () => {
  const { currentUser } = useAuth();
  const [userSkills, setUserSkills] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [experienceFilter, setExperienceFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    fetchUserData();
    fetchJobs();
  }, []);

  const fetchUserData = async () => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserSkills(userData.skills?.split(',').map(skill => skill.trim().toLowerCase()) || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const jobSnapshot = await getDocs(collection(db, 'jobs'));
      const jobList = jobSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJobs(jobList);
      setFilteredJobs(jobList);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    if (experienceFilter) {
      filtered = filtered.filter(job => {
        const jobExp = job.experience || '';
        const expNumber = parseInt(experienceFilter);
        const expMatch = jobExp.match(/\d+/g);
        if (expMatch) {
          const minExp = parseInt(expMatch[0]);
          const maxExp = expMatch[1] ? parseInt(expMatch[1]) : minExp;
          return expNumber >= minExp && expNumber <= maxExp;
        }
        return true;
      });
    }

    if (locationFilter) {
      filtered = filtered.filter(job =>
        job.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (roleFilter) {
      filtered = filtered.filter(job =>
        job.role?.toLowerCase().includes(roleFilter.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  };

  const matchJobsToUserSkills = () => {
    const matched = jobs.filter(job => {
      if (!job.skills) return false;
      const jobSkills = job.skills.split(',').map(skill => skill.trim().toLowerCase());
      const matchingSkills = jobSkills.filter(skill => userSkills.includes(skill));
      return matchingSkills.length >= Math.floor(jobSkills.length * 0.7);
    });
    setRecommendedJobs(matched);
  };

  const filterByCompany = (companyName) => {
    setCompanyFilter(companyName);
    setFilteredJobs(jobs.filter(job => job.companyName === companyName));
  };

  const clearCompanyFilter = () => {
    setCompanyFilter('');
    setFilteredJobs(jobs);
  };

  useEffect(() => {
    filterJobs();
    matchJobsToUserSkills();
  }, [experienceFilter, locationFilter, roleFilter, jobs]);

  const handleJobSelect = (job) => {
    setSelectedJob(job);
  };

  const handleBackToJobs = () => {
    setSelectedJob(null);
  };

  if (selectedJob) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        
        <JobDetailsPage job={selectedJob} onBack={handleBackToJobs} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-center text-4xl font-bold mb-8 text-gray-800">Jobs and Internships</h1>

        {/* Filters Section */}
        <div className="filters mb-6 flex flex-wrap gap-4">
          <div className="relative flex-grow">
            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Experience (Years)"
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
              className="border rounded-md pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
            />
          </div>
          <div className="relative flex-grow">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="border rounded-md pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
            />
          </div>
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border rounded-md pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
            />
          </div>
        </div>

        {/* Company Filter Message */}
        {companyFilter && (
          <div className="mb-4 bg-blue-100 p-4 rounded-md flex items-center justify-between">
            <span className="text-blue-800">
              Showing jobs from <strong>{companyFilter}</strong>
            </span>
            <button
              onClick={clearCompanyFilter}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* Recommended Jobs */}
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">Recommended Jobs</h2>
        <div className="job-list grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recommendedJobs.length ? (
            recommendedJobs.map((job) => (
              <JobCard key={job.id} job={job} filterByCompany={filterByCompany} onSelect={() => handleJobSelect(job)} />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-600">No recommended jobs found.</p>
          )}
        </div>

        {/* All Jobs */}
        <h2 className="text-2xl font-semibold mt-12 mb-4 text-gray-800">All Jobs</h2>
        <div className="job-list grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} filterByCompany={filterByCompany} onSelect={() => handleJobSelect(job)} />
          ))}
        </div>
      </main>
    </div>
  );
};
export default Jobpage;