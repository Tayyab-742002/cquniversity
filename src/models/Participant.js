import mongoose from 'mongoose';

// Define schema for test results
const testResultSchema = new mongoose.Schema({
  testId: {
    type: String,
    required: true,
    enum: ['stroopTest', 'trailMakingTest', 'corsiBlocksTest', 'fivePointsTest']
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  rawData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  metrics: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { _id: false });

// Define schema for participant
const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [18, 'Age must be at least 18'],
    max: [100, 'Age must be less than 100']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['male', 'female', 'other', 'prefer-not-to-say']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  educationLevel: {
    type: String,
    required: [true, 'Education level is required'],
    enum: ['high-school', 'bachelors', 'masters', 'doctorate', 'other']
  },
  ipAddress: {
    type: String,
    required: false
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  testResults: [testResultSchema]
});

// Create or get model
const Participant = mongoose.models.Participant || mongoose.model('Participant', participantSchema);

export default Participant; 