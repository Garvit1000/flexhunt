import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Building, 
  Calendar, 
  DollarSign,
  Bookmark,
  CheckCircle,
  ExternalLink,
  Briefcase,
  Clock,
  XCircle
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from '../components/AuthContext';
import { db } from '../firebase';
import InternshipApplicationForm from '../components/InternshipApplicationForm';
import { collection, query, getDocs, where } from 'firebase/firestore';

const SavedInternshipCard = ({ internship, onRemove, onViewDetails }) => {
  const [hasApplied, setHasApplied] = useState(false);
  const [checking, setChecking] = useState(true);
  const { currentUser } = useAuth();
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!currentUser?.uid || !internship?.id) {
        setChecking(false);
        return;
      }

      setChecking(true);
      try {
        const q = query(
          collection(db, 'internshipApplications'),
          where('userId', '==', currentUser.uid),
          where('internshipId', '==', internship.id)
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
  }, [currentUser?.uid, internship?.id]);

  const handleApplyNow = () => {
    setIsApplicationModalOpen(true);
  };

  return (
    <Card className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
              onClick={() => onRemove(internship.id)}
            >
              <XCircle className="h-5 w-5 text-red-500 hover:text-red-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Remove from bookmarks</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {internship.companyLogo ? (
              <img src={internship.companyLogo} alt={internship.companyName} className="w-full h-full object-cover" />
            ) : (
              <Briefcase className="h-6 w-6 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary">{internship.companyName}</h3>
            <p className="text-sm text-muted-foreground">{internship.industry || 'Various Industries'}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <h3 className="text-xl font-medium text-foreground mb-2">{internship.position}</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2 text-primary" />
            <span>{internship.location || 'Remote'}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 mr-2 text-primary" />
            <span>{internship.compensation || 'Competitive'}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2 text-primary" />
            <span>{internship.duration || 'Not specified'}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Building className="h-4 w-4 mr-2 text-primary" />
            <span>{internship.workType || 'On-site'}</span>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Requirements:</h4>
          <div className="flex flex-wrap gap-2">
            {internship.requirements &&
              internship.requirements.split(',').map((req, index) => (
                <Badge key={index} variant="secondary">
                  {req.trim()}
                </Badge>
              ))}
          </div>
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
          <Button onClick={handleApplyNow} className="bg-blue-500 hover:bg-blue-600 text-white">
            Apply Now
          </Button>
        )}
        <Button 
          variant="ghost" 
          onClick={handleApplyNow}
          className="text-primary flex items-center"
        >
          View Details
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>

      <div className="px-6 py-2 bg-muted text-xs text-muted-foreground">
        <Clock className="h-3 w-3 inline mr-1" />
        Deadline: {new Date(internship.deadline).toLocaleDateString()}
      </div>

      {/* Application Form Modal */}
      <InternshipApplicationForm
        internshipId={internship.id}
        isOpen={isApplicationModalOpen}
        setIsOpen={setIsApplicationModalOpen}
      />
    </Card>
  );
};

export default SavedInternshipCard;