import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../AuthContext';
import { Clock, AlertTriangle } from 'lucide-react';

const TakeAssessment = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [securityViolations, setSecurityViolations] = useState([]);
  const [violationCount, setViolationCount] = useState(0);
  const [warningShown, setWarningShown] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [assignmentRef, setAssignmentRef] = useState(null);
  const maxViolations = 3;

  // Fetch assessment and verify access
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        // First check if the user has been assigned this assessment
        const assignmentsRef = collection(db, 'assessmentAssignments');
        const assignmentQuery = query(
          assignmentsRef,
          where('assessmentId', '==', assessmentId),
          where('candidateId', '==', currentUser.uid)
        );
        const assignmentSnapshot = await getDocs(assignmentQuery);
        
        if (assignmentSnapshot.empty) {
          setError('You do not have access to this assessment.');
          setLoading(false);
          return;
        }

        // Check if assessment has already been completed
        const assignmentDoc = assignmentSnapshot.docs[0];
        const assignmentData = assignmentDoc.data();
        
        if (assignmentData.completed) {
          setError('You have already completed this assessment. Multiple attempts are not allowed.');
          setLoading(false);
          return;
        }

        // Store assignment document reference for later use
        setAssignmentRef(assignmentDoc.ref);

        // Fetch the assessment details
        const assessmentRef = doc(db, 'assessments', assessmentId);
        const assessmentSnap = await getDoc(assessmentRef);
        
        if (!assessmentSnap.exists()) {
          setError('Assessment not found.');
          setLoading(false);
          return;
        }

        const assessmentData = {
          id: assessmentSnap.id,
          ...assessmentSnap.data()
        };

        // Check if questions array exists and has valid questions
        if (!Array.isArray(assessmentData.questions) || assessmentData.questions.length === 0) {
          setError('No questions found in this assessment.');
          setLoading(false);
          return;
        }

        // Questions are already in the correct format, just need to shuffle if enabled
        let questions = assessmentData.questions;

        // Randomize questions if enabled
        if (assessmentData.settings?.shuffleQuestions) {
          questions = [...questions].sort(() => Math.random() - 0.5);
        }

        // Set initial state
        setAssessment({
          ...assessmentData,
          questions: questions
        });
        setTimeLeft(assessmentData.duration * 60 || 3600); // Default to 1 hour if no duration set
        setLoading(false);
      } catch (err) {
        console.error('Error fetching assessment:', err);
        setError('Failed to load assessment. Please try again later.');
        setLoading(false);
      }
    };

    if (currentUser && assessmentId) {
      fetchAssessment();
    }
  }, [assessmentId, currentUser]);

  const recordViolation = (type, details) => {
    setSecurityViolations(prev => [...prev, { type, timestamp: new Date(), details }]);
    if (type === 'tab_switch' || type === 'window_focus') {
      setViolationCount(prev => {
        const newCount = prev + 1;
        if (newCount >= maxViolations) {
          handleMaxViolations();
        } else if (!warningShown) {
          alert('Warning: Switching tabs/windows is not allowed during the assessment. Multiple violations will result in automatic submission.');
          setWarningShown(true);
        }
        return newCount;
      });
    }
  };

  const handleMaxViolations = async () => {
    await submitAssessment();
    alert('Assessment auto-submitted due to multiple security violations.');
  };

  const enterFullScreen = async () => {
    try {
      const elem = document.getElementById('assessment-container');
      if (elem) {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
      }
      setIsFullScreen(true);
    } catch (error) {
      console.error('Error entering full screen:', error);
    }
  };

  const startAssessment = async () => {
    if (assessment?.settings?.requireFullScreen) {
      await enterFullScreen();
    }
    setHasStarted(true);
  };

  const handleAnswer = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const submitAssessment = async () => {
    try {
      // Calculate score
      let correctAnswers = 0;
      assessment.questions.forEach(question => {
        if (answers[question.id] === question.correctOption) {
          correctAnswers++;
        }
      });
      
      const score = Math.round((correctAnswers / assessment.questions.length) * 100);
      const passingScore = assessment.passingScore || 70;
      
      await updateDoc(assignmentRef, {
        answers,
        completed: true,
        completedAt: new Date(),
        securityViolations,
        violationCount,
        score,
        passed: score >= passingScore
      });

      // Update the application status if this is linked to an application
      if (assessment.applicationId) {
        const applicationRef = doc(db, 'applications', assessment.applicationId);
        await updateDoc(applicationRef, {
          assessmentCompleted: true,
          assessmentScore: score,
          assessmentPassed: score >= passingScore
        });
      }

      // Exit full screen
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }

      navigate('/assessments');
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Failed to submit assessment. Please try again.');
    }
  };

  // Security checks
  useEffect(() => {
    if (assessment?.settings?.requireFullScreen && !isFullScreen) {
      recordViolation('full_screen_exit', 'Exited full screen mode');
    }
  }, [isFullScreen, assessment]);

  useEffect(() => {
    if (!hasStarted || !assessment?.settings?.preventTabSwitch) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('tab_switch', `Switched to another tab (Violation ${violationCount + 1} of ${maxViolations})`);
      }
    };

    const handleFocus = () => {
      if (!document.hasFocus()) {
        recordViolation('window_focus', `Switched to another window (Violation ${violationCount + 1} of ${maxViolations})`);
      }
    };

    const handleBeforeUnload = (e) => {
      if (hasStarted) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    // Prevent opening developer tools with keyboard shortcuts
    const handleKeyDown = (e) => {
      // Prevent F12
      if (e.key === 'F12') {
        e.preventDefault();
        recordViolation('dev_tools', 'Attempted to open developer tools (F12)');
      }
      
      // Prevent Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
        recordViolation('dev_tools', 'Attempted to open developer tools (Ctrl+Shift+Key)');
      }

      // Prevent Alt+Tab
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        recordViolation('alt_tab', 'Attempted to use Alt+Tab');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleFocus);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasStarted, assessment, violationCount]);

  useEffect(() => {
    const handleCopy = (e) => {
      if (assessment?.settings?.preventCopyPaste) {
        e.preventDefault();
        recordViolation('copy_paste', 'Attempted to copy content');
      }
    };

    const handlePaste = (e) => {
      if (assessment?.settings?.preventCopyPaste) {
        e.preventDefault();
        recordViolation('copy_paste', 'Attempted to paste content');
      }
    };

    const handleContextMenu = (e) => {
      if (hasStarted) {
        e.preventDefault();
        recordViolation('right_click', 'Attempted to use right-click menu');
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [assessment, hasStarted]);

  // Timer
  useEffect(() => {
    if (!hasStarted || !assessment) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, assessment]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 font-medium mb-2">Error</div>
          <div className="text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  if (!assessment?.questions?.length) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-600 font-medium mb-2">No Questions Available</div>
          <div className="text-yellow-700">This assessment has no questions yet.</div>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">{assessment.title}</h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Instructions</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Duration: {assessment.duration || 60} minutes</li>
              <li>Number of questions: {assessment.questions.length}</li>
              {assessment.settings?.preventTabSwitch && (
                <li>You cannot switch to other tabs or windows</li>
              )}
              {assessment.settings?.requireFullScreen && (
                <li>The assessment must be taken in full-screen mode</li>
              )}
              {assessment.settings?.preventCopyPaste && (
                <li>Copy and paste functions are disabled</li>
              )}
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              onClick={startAssessment}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Start Assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = assessment.questions[currentQuestion];

  if (!currentQ || !currentQ.options) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-yellow-600 font-medium mb-2">Question Not Available</div>
          <div className="text-yellow-700">This question appears to be missing or malformed.</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="assessment-container"
      className={`min-h-screen w-full ${isFullScreen ? 'fixed inset-0 bg-white z-50 overflow-y-auto' : ''}`}
    >
      <div className={`container mx-auto px-4 py-8 max-w-2xl ${isFullScreen ? 'mt-0' : ''}`}>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold">{assessment.title}</h1>
            <div className="flex items-center text-lg font-semibold">
              <Clock className="w-5 h-5 mr-2" />
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </div>
          </div>

          {securityViolations.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-100 rounded flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-600">Security Violations Detected</div>
                <div className="text-sm text-yellow-700">
                  Your violations are being recorded and may affect your assessment.
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-2">
              Question {currentQuestion + 1} of {assessment.questions.length}
            </div>
            <div className="font-medium mb-4">{currentQ.question}</div>
            
            <div className="space-y-2">
              {Array.isArray(currentQ.options) && currentQ.options.map((option, index) => (
                <label
                  key={index}
                  className={`block p-3 rounded border cursor-pointer hover:bg-gray-50 ${
                    answers[currentQ.id] === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    checked={answers[currentQ.id] === index}
                    onChange={() => handleAnswer(currentQ.id, index)}
                    className="mr-2"
                  />
                  {typeof option === 'string' ? option : option.text || 'Invalid option'}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestion(prev => prev - 1)}
              disabled={currentQuestion === 0}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            
            {currentQuestion === assessment.questions.length - 1 ? (
              <button
                onClick={submitAssessment}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeAssessment;
