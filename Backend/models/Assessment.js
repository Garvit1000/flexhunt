const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  jobPosting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  duration: {
    type: Number, // in minutes
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  passingScore: {
    type: Number,
    required: true
  },
  eligibleCandidates: [{
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'invited', 'completed', 'expired'],
      default: 'pending'
    },
    invitationSentAt: Date,
    startedAt: Date,
    completedAt: Date,
    score: Number,
    answers: [{
      question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      },
      selectedOption: Number,
      isCorrect: Boolean
    }],
    securityViolations: [{
      type: {
        type: String,
        enum: ['tab_switch', 'full_screen_exit', 'multiple_displays', 'copy_paste']
      },
      timestamp: Date,
      details: String
    }]
  }],
  settings: {
    preventTabSwitch: {
      type: Boolean,
      default: true
    },
    requireFullScreen: {
      type: Boolean,
      default: true
    },
    preventMultipleDisplays: {
      type: Boolean,
      default: true
    },
    preventCopyPaste: {
      type: Boolean,
      default: true
    },
    randomizeQuestions: {
      type: Boolean,
      default: true
    },
    showResults: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Assessment', AssessmentSchema);
