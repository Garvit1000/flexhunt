import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash } from 'lucide-react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../components/AuthContext';

const QuestionBank = () => {
  const { currentUser } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    question: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    category: '',
    difficulty: 'medium',
    points: 1
  });

  useEffect(() => {
    fetchQuestions();
  }, [currentUser]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
    try {
      const questionData = {
        ...formData,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
      };

      if (editingQuestion) {
        const questionRef = doc(db, 'questions', editingQuestion._id);
        await updateDoc(questionRef, questionData);
      } else {
        await addDoc(collection(db, 'questions'), questionData);
      }
      
      fetchQuestions();
      setShowForm(false);
      setEditingQuestion(null);
      resetForm();
    } catch (error) {
      console.error('Error saving question:', error);
      setError('Failed to save question');
    }
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'questions', questionId));
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      setError('Failed to delete question');
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setFormData({
      question: question.question,
      options: question.options,
      category: question.category,
      difficulty: question.difficulty,
      points: question.points
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      question: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      category: '',
      difficulty: 'medium',
      points: 1
    });
  };

  const handleOptionChange = (index, field, value) => {
    const newOptions = formData.options.map((option, i) => {
      if (i === index) {
        return { ...option, [field]: value };
      }
      // If setting this option as correct, set others as incorrect
      if (field === 'isCorrect' && value === true) {
        return { ...option, isCorrect: false };
      }
      return option;
    });
    setFormData({ ...formData, options: newOptions });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Question Bank</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingQuestion(null);
            resetForm();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Text
                </label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  required
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Options
                </label>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                      className="flex-1 p-2 border rounded"
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={option.isCorrect}
                        onChange={() => handleOptionChange(index, 'isCorrect', true)}
                        className="mr-2"
                        required={index === 0}
                      />
                      Correct
                    </label>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points
                  </label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingQuestion(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingQuestion ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">Loading questions...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-600">No questions in your question bank.</p>
          <p className="text-gray-600">Click the "Add Question" button to create your first question.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {Array.isArray(questions) && questions.map((question) => (
            <div
              key={question._id}
              className="bg-white p-4 rounded-lg shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{question.question}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(question)}
                    className="p-1 text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(question._id)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>

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
  );
};

export default QuestionBank;
