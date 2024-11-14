import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  Calendar, 
  Building, 
  ExternalLink, 
  CheckCircle 
} from 'lucide-react';
import JobApplicationForm from '../components/JobApplicationform';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthContext';
import { Button } from "@/components/ui/button";

const JobDetailsPage = ({ job, onBack }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checking, setChecking] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const checkExistingApplication = async () => {
      if (currentUser?.uid && job?.id) {
        setChecking(true);
        try {
          const q = query(
            collection(db, 'applications'),
            where('userId', '==', currentUser.uid),
            where('jobId', '==', job.id)
          );

          const querySnapshot = await getDocs(q);
          setHasApplied(!querySnapshot.empty);
        } catch (error) {
          console.error('Error checking application status:', error);
        } finally {
          setChecking(false);
        }
      } else {
        setChecking(false);
      }
    };

    checkExistingApplication();
  }, [currentUser?.uid, job?.id]);

  const renderApplicationButton = () => {
    if (!currentUser) {
      return (
        <Button 
          onClick={() => setIsFormOpen(true)} 
          className="bg-blue-500 hover:bg-blue-600"
        >
          Sign in to Apply
        </Button>
      );
    }

    if (checking) {
      return (
        <Button disabled className="bg-gray-400">
          Checking...
        </Button>
      );
    }

    if (hasApplied) {
      return (
        <Button 
          disabled 
          className="bg-green-500 text-white cursor-not-allowed flex items-center gap-2"
        >
          <CheckCircle className="h-5 w-5" />
          Applied Already
        </Button>
      );
    }

    return (
      <Button 
        onClick={() => setIsFormOpen(true)} 
        className="bg-blue-500 hover:bg-blue-600"
      >
        Apply Now
      </Button>
    );
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-8 max-w-4xl mx-auto my-8">
      <button 
        onClick={onBack} 
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Jobs
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{job?.title}</h1>
      </div>

      <div className="flex flex-wrap gap-6 mb-8">
        <div className="flex items-center text-gray-600">
          <Building className="h-5 w-5 mr-2" />
          <span>{job?.companyName}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <MapPin className="h-5 w-5 mr-2" />
          <span>{job?.location}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <DollarSign className="h-5 w-5 mr-2" />
          <span>{job?.salary}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Briefcase className="h-5 w-5 mr-2" />
          <span>{job?.jobType}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Clock className="h-5 w-5 mr-2" />
          <span>{job?.experience}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Calendar className="h-5 w-5 mr-2" />
          <span>Deadline: {new Date(job?.deadline).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Job Description</h2>
        <p className="text-gray-700 whitespace-pre-line">{job?.jobDescription}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Required Skills</h2>
        <div className="flex flex-wrap gap-2">
          {job?.skills?.split(',').map((skill, index) => (
            <span 
              key={index} 
              className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
            >
              {skill.trim()}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">About the Company</h2>
        <p className="text-gray-700">
          {job?.companyDescription || 'No company description available.'}
        </p>
      </div>

      <div className="flex justify-between items-center">
        {renderApplicationButton()}
        <JobApplicationForm 
          jobId={job?.id} 
          isOpen={isFormOpen} 
          setIsOpen={setIsFormOpen} 
        />
        {job?.companyWebsite && (
          <a 
            href={job.companyWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            Visit Company Website
            <ExternalLink className="h-4 w-4 ml-1" />
          </a>
        )}
      </div>
    </div>
  );
};

export default JobDetailsPage;
