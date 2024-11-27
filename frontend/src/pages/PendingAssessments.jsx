import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Clock, CheckCircle } from 'lucide-react';

export default function PendingAssessments() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingAssessments();
  }, [currentUser]);

  const fetchPendingAssessments = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // First get all applications by the user
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('userId', '==', currentUser.uid)
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
      const applications = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Then get all assessment assignments for these applications
      const assessmentData = [];
      for (const application of applications) {
        const assignmentsQuery = query(
          collection(db, 'assessmentAssignments'),
          where('candidateId', '==', currentUser.uid),
          where('jobId', '==', application.jobId)
        );
        const assignmentsSnapshot = await getDocs(assignmentsQuery);
        
        assignmentsSnapshot.docs.forEach(doc => {
          const assignment = doc.data();
          assessmentData.push({
            id: doc.id,
            ...assignment,
            jobTitle: application.jobTitle || 'Unknown Job',
            companyName: application.companyName || 'Unknown Company'
          });
        });
      }

      setAssessments(assessmentData);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1";
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'in_progress':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-blue-100 text-blue-800`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Pending Assessments</h1>

      {assessments.length === 0 ? (
        <Alert>
          <AlertTitle>No Pending Assessments</AlertTitle>
          <AlertDescription>
            You don't have any pending assessments at the moment.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">
                  {assessment.jobTitle}
                </CardTitle>
                <span className={getStatusBadge(assessment.status)}>
                  {assessment.status === 'completed' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Completed
                    </>
                  ) : assessment.status === 'in_progress' ? (
                    <>
                      <Clock className="w-4 h-4" />
                      In Progress
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Pending
                    </>
                  )}
                </span>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Company</p>
                    <p className="font-medium">{assessment.companyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Assessment Type</p>
                    <p className="font-medium">{assessment.assessmentType || 'Technical Assessment'}</p>
                  </div>
                  {assessment.dueDate && (
                    <div>
                      <p className="text-sm text-gray-500">Due Date</p>
                      <p className="font-medium">
                        {new Date(assessment.dueDate.toDate()).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div className="pt-4">
                    {assessment.status !== 'completed' && (
                      <Button
                        className="w-full"
                        onClick={() => navigate(`/assessment/take/${assessment.id}`)}
                      >
                        {assessment.status === 'in_progress' ? 'Continue Assessment' : 'Start Assessment'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
