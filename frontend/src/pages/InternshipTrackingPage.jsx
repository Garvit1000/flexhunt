import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ExternalLink, Clock } from 'lucide-react';
import { useAuth } from '../components/AuthContext';

export default function InternshipTrackingPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, loading: authLoading } = useAuth();

  const getUserRole = () => {
    const userEmail = currentUser?.email;
    return userEmail ? localStorage.getItem(`role_${userEmail}`) : null;
  };
  useEffect(() => {

    if (currentUser?.uid && getUserRole() === 'jobseeker') {
      fetchUserApplications(currentUser.uid);
    }
  }, [currentUser?.uid, getUserRole()]);
  const fetchUserApplications = async () => {
    try {
      const q = query(
        collection(db, 'internshipApplications'),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const apps = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      // Sort by submission date (newest first)
      apps.sort((a, b) => b.submittedAt.seconds - a.submittedAt.seconds);
      setApplications(apps);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please sign in to view your applications.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  if (getUserRole() !== 'jobseeker') {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>This page is only accessible to applicants.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Internship Applications</h1>
      
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-gray-600 text-lg">You haven't submitted any internship applications yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => (
            <div 
              key={app.id} 
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{app.position}</h2>
                  <p className="text-gray-600 font-medium">{app.companyName}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                  {app.status || 'Pending'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Applied: {formatDate(app.submittedAt)}</span>
                </div>

                <div className="flex flex-col space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Location:</span> {app.location}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Type:</span> {app.availability}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Compensation:</span> {app.compensation}
                  </p>
                </div>

                <div className="border-t pt-3 mt-3">
                  <h3 className="font-medium text-gray-900 mb-2">Application Details</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">GPA:</span> {app.gpa}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Major:</span> {app.major}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Graduation Year:</span> {app.graduationYear}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col space-y-2 pt-3">
                  <a
                    href={app.resumeURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Resume
                  </a>
                  {app.companyWebsite && (
                    <a
                      href={app.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Company Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}