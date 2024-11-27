import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';

const AssignAssessment = () => {
  const [assessments, setAssessments] = useState([]);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const candidateId = searchParams.get('candidateId');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch assessments created by the recruiter
        const assessmentsRef = collection(db, 'assessments');
        const assessmentQuery = query(assessmentsRef, where('createdBy', '==', currentUser.uid));
        const assessmentSnapshot = await getDocs(assessmentQuery);
        
        const assessmentList = assessmentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAssessments(assessmentList);

        // Fetch candidate data if candidateId is provided
        if (candidateId) {
          const candidateRef = doc(db, 'users', candidateId);
          const candidateSnap = await getDoc(candidateRef);
          if (candidateSnap.exists()) {
            setCandidate({
              id: candidateSnap.id,
              ...candidateSnap.data()
            });
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser, candidateId]);

  const handleAssignAssessment = async (assessmentId) => {
    try {
      const assignmentRef = collection(db, 'assessmentAssignments');
      await addDoc(assignmentRef, {
        assessmentId,
        candidateId: candidate.id,
        recruiterId: currentUser.uid,
        assignedAt: new Date(),
        status: 'pending',
        completed: false,
        score: null
      });

      alert('Assessment assigned successfully!');
      navigate(-1); // Go back to previous page
    } catch (err) {
      console.error('Error assigning assessment:', err);
      alert('Failed to assign assessment. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Assign Assessment</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Back
        </button>
      </div>

      {candidate && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Candidate</h2>
          <p className="text-gray-700">
            {candidate.displayName || 'Anonymous User'} ({candidate.email})
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assessments.length === 0 ? (
          <div className="col-span-full text-center p-4">
            <p className="text-gray-500 mb-4">No assessments created yet.</p>
            <button
              onClick={() => navigate('/assessment/create')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Create New Assessment
            </button>
          </div>
        ) : (
          assessments.map((assessment) => (
            <div key={assessment.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <h3 className="font-medium text-lg mb-2">{assessment.title}</h3>
              <p className="text-gray-600 mb-4">{assessment.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Questions: {assessment.questions?.length || 0}
                </span>
                <button
                  onClick={() => handleAssignAssessment(assessment.id)}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  Assign
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssignAssessment;
