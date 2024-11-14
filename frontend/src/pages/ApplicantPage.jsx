import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../components/AuthContext';

export default function ApplicantPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, loading: authLoading } = useAuth();
  const userRole = localStorage.getItem('userRole');

  const getUserRole = () => {
    const userEmail = currentUser?.email;
    return userEmail ? localStorage.getItem(`role_${userEmail}`) : null;
  };

  useEffect(() => {
    if (currentUser?.uid && getUserRole() === 'jobseeker') {
      fetchUserApplications(currentUser.uid);
    }
  }, [currentUser?.uid, getUserRole()]);

  const fetchUserApplications = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'applications'),
        where('userId', '==', userId) // Query applications by userId
      );

      const querySnapshot = await getDocs(q);
      const userApps = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));

      const appsWithDetails = await Promise.all(
        userApps.map(async (app) => {
          if (app.jobId) {
            const jobDetails = await fetchJobDetails(app.jobId);
            return { ...app, ...jobDetails };
          }
          return app;
        })
      );

      appsWithDetails.sort((a, b) => b.submittedAt - a.submittedAt);
      setApplications(appsWithDetails);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Failed to load your applications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobDetails = async (jobId) => {
    try {
      const jobDoc = await getDoc(doc(db, 'jobs', jobId));
      if (jobDoc.exists()) {
        const { role, companyName } = jobDoc.data();
        return { role, companyName };
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
    }
    return { role: 'Unknown', companyName: 'Unknown' };
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status?.toLowerCase()) {
      case 'accepted':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <AlertDescription>Please sign in to view your applications.</AlertDescription>
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
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Job Applications</h1>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

{loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800">Total Applications</h3>
                  <p className="text-2xl font-bold text-blue-900">{applications.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800">Accepted</h3>
                  <p className="text-2xl font-bold text-green-900">
                    {applications.filter(app => app.status === 'accepted').length}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-800">Pending</h3>
                  <p className="text-2xl font-bold text-yellow-900">
                    {applications.filter(app => app.status === 'pending' || !app.status).length}
                  </p>
                </div>
              </div>
            </div>
            
            {applications.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">You haven't submitted any applications yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{app.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.companyName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(app.status)}>{app.status || 'pending'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(app.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(app.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <a
                          href={app.resumeURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 hover:underline"
                        >
                          View Resume
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
