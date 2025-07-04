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
    required: false,
    default: {}
  },
  metrics: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    default: {}
  }
}, { 
  _id: false,
  strict: false
});

// Define schema for participant with Clerk integration
const participantSchema = new mongoose.Schema({
  // Clerk user ID (primary identifier)
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Research participant code (for research participants only)
  participantCode: {
    type: String,
    required: false,
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9]{8}$/, 'Participant code must be exactly 8 alphanumeric characters'],
    index: true
  },
  
  // User type (general or research)
  userType: {
    type: String,
    enum: ['general', 'research'],
    default: 'general',
    index: true
  },
  
  // User profile information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    index: true
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [18, 'Age must be at least 18'],
    max: [120, 'Age must be less than 120']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['male', 'female', 'other', 'prefer-not-to-say']
  },
  education: {
    type: String,
    required: [true, 'Education level is required'],
    enum: ['high-school', 'bachelors', 'masters', 'doctorate', 'other']
  },
  
  // Profile information from Google/Clerk
  profileImageUrl: {
    type: String,
    required: false
  },
  googleId: {
    type: String,
    required: false,
    index: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  
  // Test tracking
  testsCompleted: {
    type: [String],
    default: []
  },
  testResults: {
    type: [testResultSchema],
    default: []
  },
  
  // Study participation status
  studyStatus: {
    type: String,
    enum: ['registered', 'in-progress', 'completed', 'withdrawn'],
    default: 'registered'
  }
}, {
  strict: false,
  timestamps: true
});

// Indexes for performance
participantSchema.index({ clerkId: 1 });
participantSchema.index({ email: 1 }, { unique: true });
participantSchema.index({ participantCode: 1 });
participantSchema.index({ userType: 1 });
participantSchema.index({ googleId: 1 });
participantSchema.index({ createdAt: -1 });
participantSchema.index({ studyStatus: 1 });

// Virtual for full name
participantSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
participantSchema.set('toJSON', { virtuals: true });
participantSchema.set('toObject', { virtuals: true });

// Clear any existing model to prevent conflicts
if (mongoose.models.Participant) {
  delete mongoose.models.Participant;
}

// Create the model
const Participant = mongoose.model('Participant', participantSchema);

export default Participant; 