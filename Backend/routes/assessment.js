const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const auth = require('../middleware/auth');
const { isRecruiter } = require('../middleware/roles');

// Create a new question
router.post('/questions', auth, isRecruiter, async (req, res) => {
  try {
    const question = new Question({
      ...req.body,
      createdBy: req.user.id
    });
    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get questions by recruiter
router.get('/questions', auth, isRecruiter, async (req, res) => {
  try {
    const questions = await Question.find({ createdBy: req.user.id });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new assessment
router.post('/assessments', auth, isRecruiter, async (req, res) => {
  try {
    const assessment = new Assessment({
      ...req.body,
      createdBy: req.user.id
    });
    await assessment.save();
    res.status(201).json(assessment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get assessments by recruiter
router.get('/assessments', auth, isRecruiter, async (req, res) => {
  try {
    const assessments = await Assessment.find({ createdBy: req.user.id })
      .populate('questions')
      .populate('eligibleCandidates.candidate', 'name email');
    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update eligible candidates for an assessment
router.patch('/assessments/:id/candidates', auth, isRecruiter, async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    assessment.eligibleCandidates = req.body.candidates.map(candidate => ({
      candidate: candidate.id,
      status: 'pending'
    }));
    
    await assessment.save();
    res.json(assessment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get assessment for candidate
router.get('/take/:id', auth, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate('questions', '-options.isCorrect');
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const candidate = assessment.eligibleCandidates.find(
      c => c.candidate.toString() === req.user.id && c.status === 'invited'
    );

    if (!candidate) {
      return res.status(403).json({ message: 'Not authorized to take this assessment' });
    }

    if (Date.now() < assessment.startDate || Date.now() > assessment.endDate) {
      return res.status(400).json({ message: 'Assessment is not active' });
    }

    // Randomize questions if enabled
    if (assessment.settings.randomizeQuestions) {
      assessment.questions.sort(() => Math.random() - 0.5);
    }

    res.json({
      id: assessment._id,
      title: assessment.title,
      duration: assessment.duration,
      questions: assessment.questions,
      settings: assessment.settings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit assessment
router.post('/submit/:id', auth, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate('questions');
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const candidateIndex = assessment.eligibleCandidates.findIndex(
      c => c.candidate.toString() === req.user.id && c.status === 'invited'
    );

    if (candidateIndex === -1) {
      return res.status(403).json({ message: 'Not authorized to submit this assessment' });
    }

    const candidate = assessment.eligibleCandidates[candidateIndex];
    
    // Calculate score
    let score = 0;
    const answers = req.body.answers.map(answer => {
      const question = assessment.questions.find(q => q._id.toString() === answer.questionId);
      const isCorrect = question.options[answer.selectedOption].isCorrect;
      if (isCorrect) score += question.points;
      return {
        question: question._id,
        selectedOption: answer.selectedOption,
        isCorrect
      };
    });

    // Update candidate's assessment data
    candidate.status = 'completed';
    candidate.completedAt = Date.now();
    candidate.score = score;
    candidate.answers = answers;
    candidate.securityViolations = req.body.securityViolations;

    await assessment.save();

    res.json({
      score,
      passed: score >= assessment.passingScore
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Record security violation
router.post('/violation/:id', auth, async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const candidate = assessment.eligibleCandidates.find(
      c => c.candidate.toString() === req.user.id && c.status === 'invited'
    );

    if (!candidate) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    candidate.securityViolations.push({
      type: req.body.type,
      timestamp: Date.now(),
      details: req.body.details
    });

    await assessment.save();
    res.status(200).json({ message: 'Violation recorded' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
