import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';

const AssessmentList = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const userRole = localStorage.getItem(`role_${currentUser.email}`);
        const assessmentsRef = collection(db, 'assessments');
        let q;
        
        if (userRole === 'recruiter') {
          // Recruiters see assessments they created
          q = query(assessmentsRef, where('createdBy', '==', currentUser.uid));
        } else {
          // Job seekers see assessments assigned to them
          const assignmentsRef = collection(db, 'assessmentAssignments');
          const assignmentQuery = query(assignmentsRef, where('candidateId', '==', currentUser.uid));
          const assignmentSnapshot = await getDocs(assignmentQuery);
          
          const assessmentIds = assignmentSnapshot.docs.map(doc => doc.data().assessmentId);
          if (assessmentIds.length === 0) {
            setAssessments([]);
            setLoading(false);
            return;
          }
          
          q = query(assessmentsRef, where('__name__', 'in', assessmentIds));
        }
        
        const querySnapshot = await getDocs(q);
        
        const assessmentList = await Promise.all(querySnapshot.docs.map(async doc => {
          const assessment = {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          };
          
          if (userRole === 'recruiter') {
            // Get analytics data for recruiters
            const assignmentsRef = collection(db, 'assessmentAssignments');
            const assignmentsQuery = query(assignmentsRef, where('assessmentId', '==', doc.id));
            const assignmentsSnapshot = await getDocs(assignmentsQuery);
            
            const totalAttempts = assignmentsSnapshot.docs.length;
            const completedAttempts = assignmentsSnapshot.docs.filter(doc => doc.data().completed).length;
            const passedAttempts = assignmentsSnapshot.docs.filter(doc => {
              const data = doc.data();
              return data.completed && data.score >= (assessment.passingScore || 70);
            }).length;
            
            assessment.analytics = {
              totalAttempts,
              completedAttempts,
              passedAttempts,
              averageScore: completedAttempts > 0 
                ? assignmentsSnapshot.docs
                    .filter(doc => doc.data().completed)
                    .reduce((sum, doc) => sum + (doc.data().score || 0), 0) / completedAttempts
                : 0
            };
          } else {
            // Get candidate's assignment status
            const assignmentRef = collection(db, 'assessmentAssignments');
            const assignmentQuery = query(
              assignmentRef,
              where('assessmentId', '==', doc.id),
              where('candidateId', '==', currentUser.uid)
            );
            const assignmentSnapshot = await getDocs(assignmentQuery);
            
            if (!assignmentSnapshot.empty) {
              const assignmentData = assignmentSnapshot.docs[0].data();
              assessment.status = assignmentData.completed ? 'completed' : 'pending';
              assessment.score = assignmentData.score;
              assessment.passed = assignmentData.score >= (assessment.passingScore || 70);
            }
          }
          
          return assessment;
        }));
        
        // Sort by creation date, newest first
        setAssessments(assessmentList.sort((a, b) => b.createdAt - a.createdAt));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching assessments:', err);
        setError('Failed to load assessments. Please try again later.');
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchAssessments();
    }
  }, [currentUser]);

  const handleEdit = async (assessmentId, updatedData) => {
    try {
      const assessmentRef = doc(db, 'assessments', assessmentId);
      await updateDoc(assessmentRef, updatedData);
      
      setAssessments(prevAssessments => 
        prevAssessments.map(assessment => 
          assessment.id === assessmentId 
            ? { ...assessment, ...updatedData }
            : assessment
        )
      );
      
      setEditingAssessment(null);
    } catch (err) {
      console.error('Error updating assessment:', err);
      alert('Failed to update assessment. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading assessments...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  if (!assessments.length) {
    return (
      <div className="p-4">
        <div className="text-center mb-4">No assessments found.</div>
        {currentUser.role === 'recruiter' && (
          <div className="text-center">
            <Link 
              to="/assessment/create" 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Create New Assessment
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {currentUser.role === 'recruiter' ? 'Your Assessments' : 'Available Assessments'}
        </h1>
        {currentUser.role === 'recruiter' && (
          <Link 
            to="/assessment/create" 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create New Assessment
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assessments.map((assessment) => (
          <div 
            key={assessment.id} 
            className="border rounded-lg p-4 shadow hover:shadow-lg transition-shadow"
          >
            {editingAssessment === assessment.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={assessment.title}
                  onChange={(e) => {
                    setAssessments(prevAssessments =>
                      prevAssessments.map(a =>
                        a.id === assessment.id
                          ? { ...a, title: e.target.value }
                          : a
                      )
                    );
                  }}
                />
                <textarea
                  className="w-full p-2 border rounded"
                  value={assessment.description}
                  onChange={(e) => {
                    setAssessments(prevAssessments =>
                      prevAssessments.map(a =>
                        a.id === assessment.id
                          ? { ...a, description: e.target.value }
                          : a
                      )
                    );
                  }}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(assessment.id, {
                      title: assessment.title,
                      description: assessment.description
                    })}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingAssessment(null)}
                    className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-2">{assessment.title}</h2>
                <p className="text-gray-600 mb-4">{assessment.description}</p>
                
                {/* Analytics Section */}
                <div className="bg-gray-50 p-3 rounded mb-4">
                  <h3 className="font-medium mb-2">Analytics</h3>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-gray-600">Total</div>
                      <div className="font-semibold">{assessment.analytics?.totalAttempts}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Completed</div>
                      <div className="font-semibold">{assessment.analytics?.completedAttempts}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Passed</div>
                      <div className="font-semibold">{assessment.analytics?.passedAttempts}</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  {currentUser.role === 'recruiter' ? (
                    <button
                      onClick={() => setEditingAssessment(assessment.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                  ) : (
                    <Link 
                      to={`/assessment/take/${assessment.id}`}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Take Assessment
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssessmentList;
