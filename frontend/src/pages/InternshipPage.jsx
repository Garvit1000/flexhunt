import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Building, 
  Calendar, 
  DollarSign, 
  Search, 
  Bookmark,
  CheckCircle,
  ExternalLink,
  Briefcase,
  Clock,
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from '../firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { useAuth } from '../components/AuthContext';
import InternshipDetailsPage from './InternshipDetailsPage';

const InternshipCard = ({ internship, filterByCompany, onViewDetails, onSelect }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checking, setChecking] = useState(true);
  const { currentUser } = useAuth();

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

  const handleBookmarkToggle = () => {
    const savedInternships = JSON.parse(localStorage.getItem('savedInternships')) || [];
    
    if (isBookmarked) {
      // Remove from bookmarks
      const updatedInternships = savedInternships.filter(
        (saved) => saved.id !== internship.id
      );
      localStorage.setItem('savedInternships', JSON.stringify(updatedInternships));
      setIsBookmarked(false);
    } else {
      // Add to bookmarks
      const updatedInternships = [...savedInternships, internship];
      localStorage.setItem('savedInternships', JSON.stringify(updatedInternships));
      setIsBookmarked(true);
    }
  };

  return (
    <Card className="job-card transition-all duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {internship.companyLogo ? (
              <img src={internship.companyLogo} alt={internship.companyName} className="w-full h-full object-cover" />
            ) : (
              <Briefcase className="h-6 w-6 text-gray-400" />
            )}
          </div>
          <div>
            <button
              onClick={() => filterByCompany(internship.companyName)}
              className="text-lg font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {internship.companyName}
            </button>
            <p className="text-sm text-muted-foreground">{internship.industry || 'Various Industries'}</p>
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
        <h3 className="text-xl font-medium text-foreground mb-2">{internship.position}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          <span className="font-semibold">Type:</span> Internship
        </p>
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
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">Description:</h4>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {internship.description || 'No description available.'}
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
          <Button onClick={() => onViewDetails(internship)} className="bg-blue-500 hover:bg-blue-600 text-white">
            Apply Now
          </Button>
        )}
        <Button 
          variant="ghost" 
          onClick={() => onViewDetails(internship)} 
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
    </Card>
  );
};

const InternshipPage = () => {
  // All hooks at the top of the component
  const [internships, setInternships] = useState([]);
  const [filteredInternships, setFilteredInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [filterCompensation, setFilterCompensation] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const itemsPerPage = 6;

  // Effect for fetching internships
  useEffect(() => {
    const fetchInternships = async () => {
      try {
        setLoading(true);
        const internshipsRef = collection(db, 'internshipapplication');
        const querySnapshot = await getDocs(internshipsRef);
        const internshipsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setInternships(internshipsData);
        setFilteredInternships(internshipsData);
        setError(null);
      } catch (err) {
        console.error("Error fetching internships:", err);
        setError("Failed to load internships. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchInternships();
  }, []);

  // Effect for filtering internships
  useEffect(() => {
    let filtered = internships.filter(internship => {
      const matchesSearch = !searchTerm || 
        internship.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        internship.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        internship.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = !locationSearch || 
        internship.location?.toLowerCase().includes(locationSearch.toLowerCase());
      
      const matchesCompensation = filterCompensation === "all" || 
        internship.compensation?.toLowerCase() === filterCompensation.toLowerCase();

      return matchesSearch && matchesLocation && matchesCompensation;
    });
    
    setFilteredInternships(filtered);
    setCurrentPage(1);
  }, [internships, searchTerm, locationSearch, filterCompensation]);

  const handleViewDetails = (internship) => {
    setSelectedInternship(internship);
    setShowDetails(true);
  };

  const handleBack = () => {
    setShowDetails(false);
    setSelectedInternship(null);
  };

  const handleInternshipSelect = (internship) => {
    console.log("Selected internship:", internship);
  };

  const filterByCompany = (companyName) => {
    setSearchTerm(companyName);
  };

  const pageCount = Math.ceil(filteredInternships.length / itemsPerPage);
  const paginatedInternships = filteredInternships.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Render content based on state
  const renderContent = () => {
    if (loading) {
      return (
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Loading internships...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      );
    }

    if (showDetails && selectedInternship) {
      return (
        <InternshipDetailsPage 
          internship={selectedInternship} 
          onBack={handleBack} 
        />
      );
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-primary">Internship Opportunities</h1>
        
        {/* Filters section */}
        <div className="mb-8 space-y-4 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="mb-2 block font-medium">Search Internships</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  placeholder="Search by position, company, or keywords"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex-1">
              <Label htmlFor="location" className="mb-2 block font-medium">Location Search</Label>
              <div className="relative">
                <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="location"
                  placeholder="Search by location"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <Label htmlFor="compensation" className="mb-2 block font-medium">Compensation</Label>
              <Select value={filterCompensation} onValueChange={setFilterCompensation}>
                <SelectTrigger id="compensation">
                  <SelectValue placeholder="Select compensation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 text-gray-600">
          Showing {filteredInternships.length} internships
        </div>

        {/* Internships grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedInternships.map(internship => (
            <InternshipCard 
              key={internship.id} 
              internship={internship}
              filterByCompany={filterByCompany}
              onViewDetails={handleViewDetails}
              onSelect={handleInternshipSelect}
            />
          ))}
        </div>

        
        {/* Pagination */}
        {pageCount > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            {Array.from({ length: pageCount }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
              disabled={currentPage === pageCount}
            >
              Next
            </Button>
          </div>
        )}

        {/* No results message */}
        {filteredInternships.length === 0 && (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No internships found</h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria to find more opportunities.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Main return
  return renderContent();
};

export default InternshipPage;