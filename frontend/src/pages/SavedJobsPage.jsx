import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JobCard from './JobCard';
import JobApplicationForm from '../components/JobApplicationform';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const SavedJobsPage = () => {
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  // Load saved jobs from localStorage when the component mounts
  useEffect(() => {
    const jobs = JSON.parse(localStorage.getItem('savedJobs')) || [];
    setSavedJobs(jobs);
  }, []);

  // Remove a job from saved jobs
  const handleRemoveBookmark = (jobId) => {
    const updatedJobs = savedJobs.filter((job) => job.id !== jobId);
    setSavedJobs(updatedJobs);
    localStorage.setItem('savedJobs', JSON.stringify(updatedJobs));
  };

  // Handle job selection for applying
  const handleJobSelect = (job) => {
    setSelectedJobId(job.id);
    setIsApplicationModalOpen(true);
  };

  
  

  // Filter jobs by company (placeholder function to match JobCard props)
  const handleFilterByCompany = (companyName) => {
    // You can implement company filtering logic here if needed
    console.log(`Filtering by company: ${companyName}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">Saved Jobs</h1>

        {savedJobs.length === 0 ? (
          <Alert>
            <AlertDescription>
              No saved jobs yet. Bookmark some jobs to view them here!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedJobs.map((job) => (
              <div key={job.id} className="relative">
                <JobCard
                  job={job}
                  filterByCompany={handleFilterByCompany}
                  onSelect={handleJobSelect}
                  
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-4 right-4"
                  onClick={() => handleRemoveBookmark(job.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Job Application Modal */}
        {selectedJobId && (
          <JobApplicationForm
            jobId={selectedJobId}
            isOpen={isApplicationModalOpen}
            setIsOpen={setIsApplicationModalOpen}
          />
        )}
      </div>
    </div>
  );
};

export default SavedJobsPage;