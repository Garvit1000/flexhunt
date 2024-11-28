import React, { useState, useEffect } from 'react';
import { collection, query, where, doc, getDoc, getDocs, addDoc, onSnapshot, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Badge, Table, Button, Container, Row, Col, Card, Spinner } from 'react-bootstrap';

const AssignAssessment = () => {
  const [assessments, setAssessments] = useState([]);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const candidateId = searchParams.get('candidateId');

  // Fetch candidate and assessments data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!candidateId) {
          setError('No candidate ID provided');
          setLoading(false);
          return;
        }

        // First try to fetch from users collection
        const candidateRef = doc(db, 'users', candidateId);
        let candidateDoc = await getDoc(candidateRef);
        
        if (!candidateDoc.exists()) {
          // If not found in users, try applications collection
          const applicationsRef = collection(db, 'applications');
          const q = query(applicationsRef, where('candidateId', '==', candidateId));
          const applicationSnapshot = await getDocs(q);
          
          if (applicationSnapshot.empty) {
            setError('Candidate not found');
            setLoading(false);
            return;
          }
          
          // Use the first application's data
          const applicationData = applicationSnapshot.docs[0].data();
          setCandidate({
            id: candidateId,
            displayName: applicationData.name,
            email: applicationData.email,
            ...applicationData
          });
        } else {
          setCandidate({
            id: candidateDoc.id,
            ...candidateDoc.data()
          });
        }

        // Fetch assessments created by the current recruiter
        const assessmentsRef = collection(db, 'assessments');
        const assessmentsQuery = query(assessmentsRef, where('createdBy', '==', currentUser.uid));
        const assessmentsSnapshot = await getDocs(assessmentsQuery);
        const assessmentsData = assessmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAssessments(assessmentsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [candidateId]);

  // Fetch assignments for the candidate
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        if (!candidateId) return;

        const assignmentsRef = collection(db, 'assessmentAssignments');
        const assignmentsQuery = query(
          assignmentsRef,
          where('candidateId', '==', candidateId)
        );
        
        // Set up real-time listener for assignments
        const unsubscribe = onSnapshot(assignmentsQuery, (snapshot) => {
          const assignments = [];
          snapshot.forEach((doc) => {
            assignments.push({ id: doc.id, ...doc.data() });
          });
          setAssignments(assignments);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setError('Failed to load assignments');
      }
    };

    if (candidateId) {
      fetchAssignments();
    }
  }, [candidateId]);

  const handleAssignAssessment = async (assessmentId) => {
    if (!candidateId || !assessmentId) {
      setError('Missing required information');
      return;
    }

    try {
      setLoading(true);

      // Create assessment assignment
      const assignmentData = {
        assessmentId,
        candidateId,
        assignedBy: currentUser.uid,
        assignedAt: serverTimestamp(),
        completed: false,
        score: null,
        passingScore: null,
        status: 'assigned'
      };

      const assignmentRef = await addDoc(collection(db, 'assessmentAssignments'), assignmentData);

      // Update application with assessment ID
      const applicationsRef = collection(db, 'applications');
      const q = query(applicationsRef, where('candidateId', '==', candidateId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const applicationDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'applications', applicationDoc.id), {
          assessmentId: assessmentId,
          assessmentStatus: 'assigned',
          updatedAt: serverTimestamp()
        });
      }

      alert('Assessment assigned successfully!');
      navigate(-1);
    } catch (error) {
      console.error('Error assigning assessment:', error);
      setError('Failed to assign assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (assignment) => {
    if (!assignment) return null;
    
    if (assignment.completed) {
      return (
        <Badge bg={assignment.passed ? "success" : "danger"}>
          {assignment.passed ? "Passed" : "Failed"} ({assignment.score}%)
        </Badge>
      );
    }
    return <Badge bg="warning">Pending</Badge>;
  };

  const handleRevokeAccess = async (assignmentId) => {
    try {
      const assignmentRef = doc(db, 'assessmentAssignments', assignmentId);
      await deleteDoc(assignmentRef);

      alert('Access revoked successfully!');
      navigate(-1); // Go back to previous page
    } catch (err) {
      console.error('Error revoking access:', err);
      alert('Failed to revoke access. Please try again.');
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {candidate && (
        <div className="mb-4">
          <h2>Assign Assessment to {candidate.displayName || candidate.email}</h2>
        </div>
      )}

      <Row>
        <Col>
          <h3 className="mb-3">Available Assessments</h3>
          <Row xs={1} md={2} lg={3} className="g-4">
            {assessments.length === 0 ? (
              <Col>
                <p>No assessments available.</p>
              </Col>
            ) : (
              assessments.map((assessment) => (
                <Col key={assessment.id}>
                  <Card>
                    <Card.Body>
                      <Card.Title>{assessment.title}</Card.Title>
                      <Card.Text>
                        Duration: {assessment.duration} minutes<br />
                        Questions: {assessment.questions?.length || 0}
                      </Card.Text>
                      <Button
                        variant="primary"
                        onClick={() => handleAssignAssessment(assessment.id)}
                      >
                        Assign Assessment
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            )}
          </Row>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <h3 className="mb-3">Assigned Assessments</h3>
          <Table responsive striped bordered hover>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Email</th>
                <th>Assigned Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>{candidate?.displayName || 'Anonymous User'}</td>
                  <td>{candidate?.email}</td>
                  <td>{assignment.assignedAt?.toDate().toLocaleDateString()}</td>
                  <td>{getStatusBadge(assignment)}</td>
                  <td>
                    {!assignment.completed && (
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleRevokeAccess(assignment.id)}
                      >
                        Revoke Access
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
};

export default AssignAssessment;
