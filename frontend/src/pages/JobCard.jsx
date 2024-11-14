
import React, { useState, useEffect } from 'react';
import { 
  Bookmark, 
  MapPin, 
  DollarSign, 
  Clock, 
  Briefcase, 
  CheckCircle, 
  ExternalLink
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthContext';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const JobCard = ({ job, filterByCompany, onSelect }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checking, setChecking] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!currentUser?.uid || !job?.id) {
        setChecking(false);
        return;
      }

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
    };

    checkExistingApplication();
  }, [currentUser?.uid, job?.id]);

  const handleBookmarkToggle = () => {
    const savedJobs = JSON.parse(localStorage.getItem('savedJobs')) || [];
    const updatedJobs = isBookmarked
      ? savedJobs.filter((savedJob) => savedJob.id !== job.id)
      : [...savedJobs, job];

    localStorage.setItem('savedJobs', JSON.stringify(updatedJobs));
    setIsBookmarked(!isBookmarked);
  };

  return (
    <Card className="job-card transition-all duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {job.companyLogo ? (
              <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-cover" />
            ) : (
              <Briefcase className="h-6 w-6 text-gray-400" />
            )}
          </div>
          <div>
            <button
              onClick={() => filterByCompany(job.companyName)}
              className="text-lg font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {job.companyName}
            </button>
            <p className="text-sm text-muted-foreground">{job.industry || 'Various Industries'}</p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBookmarkToggle}
                aria-label={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
              >
                <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-primary' : 'text-muted-foreground'}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        <h3 className="text-xl font-medium text-foreground mb-2">{job.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          <span className="font-semibold">Role:</span> {job.role || 'Not specified'}
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2 text-primary" />
            <span>{job.location || 'Remote'}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 mr-2 text-primary" />
            <span>{job.salary || 'Competitive'}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Briefcase className="h-4 w-4 mr-2 text-primary" />
            <span>{job.jobType || 'Full-time'}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2 text-primary" />
            <span>{job.experience || 'All levels'}</span>
          </div>
        </div>
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Required Skills:</h4>
          <div className="flex flex-wrap gap-2">
            {job.skills &&
              job.skills.split(',').map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill.trim()}
                </Badge>
              ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">Job Description:</h4>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {job.jobDescription || 'No description available. Click "View Details" for more information.'}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-4">
        {checking ? (
          <Button disabled>Checking...</Button>
        ) : hasApplied ? (
          <Button disabled variant="secondary" className="cursor-not-allowed">
            <CheckCircle className="h-4 w-4 mr-2" />
            Applied Already
          </Button>
        ) : (
          <Button onClick={() => onSelect(job)} className="bg-blue-500 hover:bg-blue-600 text-white">
            Apply Now
          </Button>
        )}
        <Button variant="ghost"  onClick={() => onSelect(job)} className="text-primary flex items-center">
          View Details
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
      <div className="px-6 py-2 bg-muted text-xs text-muted-foreground">
        <Clock className="h-3 w-3 inline mr-1" />
        Deadline: {new Date(job.deadline).toLocaleDateString()}
      </div>
    </Card>
  );
};

export default JobCard;