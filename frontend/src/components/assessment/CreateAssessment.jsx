import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Award, Settings, Users } from 'lucide-react';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../components/AuthContext';

const CreateAssessment = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    jobPosting: '',
    duration: 60,
    startDate: '',
    endDate: '',
    passingScore: 70,
    settings: {
      preventTabSwitch: true,
      requireFullScreen: true,
      preventMultipleDisplays: true,
      preventCopyPaste: true,
      randomizeQuestions: true,
      showResults: false
    }
  });

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get questions from Firebase
      const questionsRef = collection(db, 'questions');
      const q = query(questionsRef, where('createdBy', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      const fetchedQuestions = [];
      querySnapshot.forEach((doc) => {
        fetchedQuestions.push({
          _id: doc.id,
          ...doc.data()
        });
      });
      
      setQuestions(fetchedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Failed to fetch questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedQuestions.length === 0) {
      setError('Please select at least one question for the assessment');
      return;
    }

    if (!formData.title || !formData.duration) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      // Get the selected questions' full data
      const selectedQuestionsData = questions.filter(q => selectedQuestions.includes(q._id));
      
      // Convert dates to timestamps if they exist
      const startDate = formData.startDate ? new Date(formData.startDate) : null;
      const endDate = formData.endDate ? new Date(formData.endDate) : null;

      const assessmentData = {
        title: formData.title,
        jobPosting: formData.jobPosting || '',
        duration: parseInt(formData.duration) || 60,
        startDate: startDate,
        endDate: endDate,
        passingScore: parseInt(formData.passingScore) || 70,
        questions: selectedQuestionsData.map(q => ({
          id: q._id,
          question: q.question,
          options: q.options.map(opt => opt.text), // Convert options to array of strings
          correctOption: q.options.findIndex(opt => opt.isCorrect), // Store index of correct option
          points: parseInt(q.points) || 1,
          category: q.category || '',
          difficulty: q.difficulty || 'medium'
        })),
        totalPoints: selectedQuestionsData.reduce((sum, q) => sum + (parseInt(q.points) || 1), 0),
        createdBy: currentUser.uid,
        creatorName: currentUser?.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        status: 'active',
        totalQuestions: selectedQuestions.length,
        timeLimit: parseInt(formData.duration) || 60,
        settings: {
          preventTabSwitch: Boolean(formData.settings?.preventTabSwitch),
          requireFullScreen: Boolean(formData.settings?.requireFullScreen),
          preventMultipleDisplays: Boolean(formData.settings?.preventMultipleDisplays),
          preventCopyPaste: Boolean(formData.settings?.preventCopyPaste),
          shuffleQuestions: Boolean(formData.settings?.randomizeQuestions),
          showResults: Boolean(formData.settings?.showResults)
        }
      };

      // Add assessment to Firebase
      const assessmentsRef = collection(db, 'assessments');
      const docRef = await addDoc(assessmentsRef, assessmentData);
      
      alert('Assessment created successfully!');
      navigate('/assessments');
    } catch (error) {
      console.error('Error creating assessment:', error);
      setError('Failed to create assessment: ' + error.message);
    }
  };

  const toggleQuestion = (questionId) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create Assessment</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assessment Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Posting
              </label>
              <input
                type="text"
                name="jobPosting"
                value={formData.jobPosting}
                onChange={(e) => setFormData({ ...formData, jobPosting: e.target.value })}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  name="passingScore"
                  value={formData.passingScore}
                  onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="100"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Security Settings</h2>
          
          <div className="grid gap-3">
            {Object.entries(formData.settings).map(([key, value]) => (
              <label key={key} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      [key]: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Questions</h2>
          
          {loading ? (
            <div className="text-center py-4">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-4">
              <p>No questions available.</p>
              <button
                type="button"
                onClick={() => navigate('/assessment/question-bank')}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Add questions to your question bank
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {questions.map((question) => (
                <div
                  key={question._id}
                  className={`p-4 rounded border cursor-pointer ${
                    selectedQuestions.includes(question._id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => toggleQuestion(question._id)}
                >
                  <div className="font-medium mb-2">{question.question}</div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {question.options.map((option, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded ${
                          option.isCorrect ? 'bg-green-100' : 'bg-gray-100'
                        }`}
                      >
                        {option.text}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Category: {question.category}</span>
                    <span>Difficulty: {question.difficulty}</span>
                    <span>Points: {question.points}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            disabled={selectedQuestions.length === 0}
          >
            Create Assessment
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAssessment;
