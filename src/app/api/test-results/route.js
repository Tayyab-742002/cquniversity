import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';
import mongoose from 'mongoose';

export async function POST(request) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Get test result data from request body
    const { participantId, testType, testData, endTime } = await request.json();
    
    // Validate required fields
    if (!participantId || !testType || !testData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate participant ID format
    if (!mongoose.Types.ObjectId.isValid(participantId)) {
      return NextResponse.json(
        { error: 'Invalid participant ID format' },
        { status: 400 }
      );
    }
    
    // Validate test type
    const validTestTypes = ['stroopTest', 'trailMakingTest', 'corsiBlocksTest', 'fivePointsTest'];
    if (!validTestTypes.includes(testType)) {
      return NextResponse.json(
        { error: 'Invalid test type' },
        { status: 400 }
      );
    }
    
    // Find the participant
    const participant = await Participant.findById(participantId);
    
    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }
    
    // Update test results
    // Create the update object with MongoDB dot notation for nested fields
    const updateData = {
      [`testResults.${testType}.completed`]: true,
      [`testResults.${testType}.endTime`]: endTime || new Date(),
      [`testResults.${testType}.data`]: testData
    };
    
    // If this is the first time the test is being started, set the start time
    if (!participant.testResults?.[testType]?.startTime) {
      updateData[`testResults.${testType}.startTime`] = new Date();
    }
    
    // Update the participant document
    const updatedParticipant = await Participant.findByIdAndUpdate(
      participantId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Test results saved successfully',
      testStatus: {
        completed: updatedParticipant.testResults[testType].completed,
        startTime: updatedParticipant.testResults[testType].startTime,
        endTime: updatedParticipant.testResults[testType].endTime
      }
    });
  } catch (error) {
    console.error('Error saving test results:', error);
    return NextResponse.json(
      { error: 'Failed to save test results' },
      { status: 500 }
    );
  }
} 