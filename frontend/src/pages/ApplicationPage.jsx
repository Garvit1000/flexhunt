import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Check, X, Loader2, FileText, Filter } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ApplicationPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const getUserRole = () => {
    const userEmail = currentUser?.email;
    return userEmail ? localStorage.getItem(`role_${userEmail}`) : null;
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchApplications();
  }, [currentUser]);

  const fetchApplications = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // First get all jobs posted by this recruiter
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('recruiterId', '==', currentUser.uid)
      );
      
      const jobsSnapshot = await getDocs(jobsQuery);
      const recruiterJobs = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('Recruiter jobs:', recruiterJobs); // Debug log

      // Then get applications for each job
      const allApplications = [];
      for (const job of recruiterJobs) {
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('jobId', '==', job.id)
        );
        
        const applicationsSnapshot = await getDocs(applicationsQuery);
        const jobApplications = applicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          jobTitle: job.role || 'Unknown Position',
          companyName: job.companyName || 'Unknown Company'
        }));
        
        allApplications.push(...jobApplications);
      }

      console.log('All applications:', allApplications); // Debug log
      setApplications(allApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    setUpdateLoading(prev => ({ ...prev, [applicationId]: true }));
    try {
      const applicationRef = doc(db, 'applications', applicationId);
      await updateDoc(applicationRef, {
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: currentUser.email
      });
      
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus } 
            : app
        )
      );
    } catch (error) {
      console.error('Error updating application:', error);
    } finally {
      setUpdateLoading(prev => ({ ...prev, [applicationId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1";
    switch (status) {
      case 'accepted':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
    }
  };

  const getFilteredApplications = () => {
    if (filterStatus === 'all') return applications;
    return applications.filter(app => app.status === filterStatus);
  };

  if (!currentUser) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please sign in to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (getUserRole() !== 'recruiter') {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to view this page. This page is only accessible to recruiters.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const filteredApplications = getFilteredApplications();

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Job Applications Dashboard</h1>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select 
              className="border rounded-md px-3 py-2 bg-white"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Applications</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : applications.length === 0 ? (
          <Alert>
            <AlertTitle>No Applications Yet</AlertTitle>
            <AlertDescription>
              You haven't received any applications for your job posts yet.
            </AlertDescription>
          </Alert>
        ) : filteredApplications.length === 0 ? (
          <Alert>
            <AlertTitle>No Applications Found</AlertTitle>
            <AlertDescription>
              No applications found with the selected filter.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-6">
            {filteredApplications.map((application) => (
              <Card key={application.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-xl font-bold">
                      {application.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500">Applied for: {application.jobTitle}</p>
                  </div>
                  <span className={getStatusBadge(application.status || 'pending')}>
                    {(application.status || 'pending').charAt(0).toUpperCase() + (application.status || 'pending').slice(1)}
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Contact Information</p>
                      <p className="font-medium">{application.email} • {application.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Experience</p>
                      <p className="font-medium">{application.experience}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Education</p>
                      <p className="font-medium">{application.education}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Skills</p>
                      <p className="font-medium">{application.skills}</p>
                    </div>
                    <div className="flex items-center gap-4 pt-4">
                      {application.resumeURL && (
                        <a
                          href={application.resumeURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
                        >
                          <FileText className="w-4 h-4" />
                          View Resume
                        </a>
                      )}
                      {(!application.status || application.status === 'pending') && (
                        <div className="flex gap-2 ml-auto">
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'accepted')}
                            disabled={updateLoading[application.id]}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                          >
                            {updateLoading[application.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Accept
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'rejected')}
                            disabled={updateLoading[application.id]}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                          >
                            {updateLoading[application.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}