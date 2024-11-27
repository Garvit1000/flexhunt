import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Loader2, FileText, Users, Clock, Filter, BookOpen } from 'lucide-react';
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

  const StatusCard = ({ title, count, icon: Icon, className }) => (
    <Card className="bg-white">
      <CardContent className="flex items-center p-6">
        <div className={`p-3 rounded-full ${className} mr-4`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold">{count}</p>
        </div>
      </CardContent>
    </Card>
  );

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
        ) : applications.length === 0 ? (
          <Alert>
            <AlertTitle>No Applications Yet</AlertTitle>
            <AlertDescription>
              You haven't received any applications for your job posts yet.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatusCard 
                title="Total Applications" 
                count={applications.length}
                icon={Users}
                className="bg-blue-100 text-blue-600"
              />
              <StatusCard 
                title="Pending Review" 
                count={applications.filter(app => !app.status || app.status === 'pending').length}
                icon={Clock}
                className="bg-yellow-100 text-yellow-600"
              />
              <StatusCard 
                title="Processed" 
                count={applications.filter(app => app.status === 'accepted' || app.status === 'rejected').length}
                icon={FileText}
                className="bg-green-100 text-green-600"
              />
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 text-sm font-semibold text-gray-600">Job Title</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-600">Candidate</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-600">Contact</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-600">Experience</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-600">Skills</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-600">Status</th>
                        <th className="text-left p-3 text-sm font-semibold text-gray-600">Resume</th>
                        <th className="text-right p-3 text-sm font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredApplications().map((app) => (
                        <tr key={app.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <p className="font-medium text-gray-900">{app.jobTitle}</p>
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium text-gray-900">{app.name}</p>
                              <p className="text-sm text-gray-500">{app.education}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="text-sm">{app.email}</p>
                              <p className="text-sm text-gray-500">{app.phone}</p>
                            </div>
                          </td>
                          <td className="p-3 text-sm">{app.experience}</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {app.skills?.split(',').map((skill, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                  {skill.trim()}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={getStatusBadge(app.status || 'pending')}>
                              {(app.status || 'pending').charAt(0).toUpperCase() + (app.status || 'pending').slice(1)}
                            </span>
                          </td>
                          <td className="p-3">
                            {app.resumeURL && (
                              <a
                                href={app.resumeURL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 text-sm"
                              >
                                <FileText className="w-4 h-4" />
                                View
                              </a>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex justify-end space-x-2">
                              {(!app.status || app.status === 'pending') && (
                                <>
                                  <button
                                    onClick={() => handleStatusUpdate(app.id, 'accepted')}
                                    disabled={updateLoading[app.id]}
                                    className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Accept application"
                                  >
                                    {updateLoading[app.id] ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Check className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(app.id, 'rejected')}
                                    disabled={updateLoading[app.id]}
                                    className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Reject application"
                                  >
                                    {updateLoading[app.id] ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <X className="w-4 h-4" />
                                    )}
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => navigate(`/assessment/assign?candidateId=${app.userId}`)}
                                className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                                title="Assign Assessment"
                              >
                                <BookOpen className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}