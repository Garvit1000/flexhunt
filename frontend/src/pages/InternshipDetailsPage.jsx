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
  GraduationCap,
  CheckCircle 
} from 'lucide-react';
import InternshipApplicationForm from '../components/InternshipApplicationForm';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthContext';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

const InternshipDetailsPage = ({ internship, onBack }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checking, setChecking] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const checkExistingApplication = async () => {
      if (currentUser?.uid && internship?.id) {
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
      } else {
        setChecking(false);
      }
    };

    checkExistingApplication();
  }, [currentUser?.uid, internship?.id]);

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
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8">
          <button 
            onClick={onBack} 
            className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Internships
          </button>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{internship?.position}</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center text-gray-600">
              <Building className="h-5 w-5 mr-2" />
              <span>{internship?.companyName}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{internship?.location}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <DollarSign className="h-5 w-5 mr-2" />
              <span>{internship?.compensation}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar className="h-5 w-5 mr-2" />
              <span>Start Date: {new Date(internship?.startDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="h-5 w-5 mr-2" />
              <span>Duration: {
                new Date(internship?.endDate).getMonth() - 
                new Date(internship?.startDate).getMonth() + 
                " months"
              }</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar className="h-5 w-5 mr-2" />
              <span>Apply by: {new Date(internship?.deadline).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Internship Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{internship?.description}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Requirements</h2>
              <p className="text-gray-700 whitespace-pre-line">{internship?.requirements}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">How to Apply</h2>
              <p className="text-gray-700 whitespace-pre-line">{internship?.applicationProcess}</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">About the Company</h2>
              <div className="space-y-4">
                <p className="text-gray-700">{internship?.companyDescription}</p>
                <div className="flex items-center text-gray-600">
                  <Briefcase className="h-5 w-5 mr-2" />
                  <span>Industry: {internship?.industry}</span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
              <div className="space-y-2">
                <p className="text-gray-700">Contact Person: {internship?.contactName}</p>
                <p className="text-gray-700">Email: {internship?.contactEmail}</p>
                {internship?.contactPhone && (
                  <p className="text-gray-700">Phone: {internship?.contactPhone}</p>
                )}
              </div>
            </section>
          </div>

          <div className="flex justify-between items-center mt-8">
            {renderApplicationButton()}
            <InternshipApplicationForm 
              internshipId={internship?.id} 
              isOpen={isFormOpen} 
              setIsOpen={setIsFormOpen} 
            />
            {internship?.companyWebsite && (
              <a 
                href={internship.companyWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center"
              >
                Visit Company Website
                <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InternshipDetailsPage;