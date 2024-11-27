import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Check, X, Loader2, FileText, Users, Clock, Filter, BookOpen } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ApplicationPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [recruiterJobs, setRecruiterJobs] = useState([]);

  const getUserRole = () => {
    const userEmail = currentUser?.email;
    return userEmail ? localStorage.getItem(`role_${userEmail}`) : null;
  };

  useEffect(() => {
    if (!authLoading && currentUser && getUserRole() === 'recruiter') {
      fetchRecruiterJobs();
    }
  }, [currentUser, authLoading]);

  const fetchRecruiterJobs = async () => {
    try {
      setLoading(true);
      // Query jobs posted by this recruiter
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('recruiterEmail', '==', currentUser.email)
      );
      const jobsSnapshot = await getDocs(jobsQuery);
      const jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecruiterJobs(jobs);

      // Fetch applications for all jobs
      const allApplications = [];
      for (const job of jobs) {
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('jobId', '==', job.id)
        );
        const applicationsSnapshot = await getDocs(applicationsQuery);
        const jobApplications = applicationsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          jobTitle: job.title || 'Unknown Job'
        }));
        allApplications.push(...jobApplications);
      }
      setApplications(allApplications);
    } catch (error) {
      console.error('Error fetching data:', error);
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
          <Card>
            <CardContent className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </CardContent>
          </Card>
        ) : recruiterJobs.length === 0 ? (
          <Alert>
            <AlertTitle>No Jobs Posted</AlertTitle>
            <AlertDescription>
              You haven't posted any jobs yet. Post a job to start receiving applications.
            </AlertDescription>
          </Alert>
        ) : filteredApplications.length === 0 ? (
          <Alert>
            <AlertTitle>No Applications Found</AlertTitle>
            <AlertDescription>
              {filterStatus === 'all' 
                ? "You haven't received any applications for your job posts yet."
                : `No ${filterStatus} applications found.`}
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
                  <span className={getStatusBadge(application.status)}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
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
                      {application.status === 'pending' && (
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