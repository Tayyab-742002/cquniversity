import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';
import mongoose from 'mongoose';

/**
 * Debug API endpoint to check if test results are being saved in the database
 * @returns {Promise<NextResponse>} Response with test results data
 */
export async function GET(request) {
  try {
    // Get participant ID from query params
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participantId');
    
    if (!participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Find participant
    const participant = await Participant.findById(participantId);
    
    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }
    
    // Get test results directly from MongoDB to bypass any schema issues
    const result = await Participant.collection.findOne({ _id: new mongoose.Types.ObjectId(participantId) });
    
    // Check if test results exist
    const hasTestResults = result && result.testResults && result.testResults.length > 0;
    
    return NextResponse.json({
      participantId,
      hasTestResults,
      testResultsCount: hasTestResults ? result.testResults.length : 0,
      testResults: hasTestResults ? result.testResults : [],
      participant: {
        name: participant.name.charAt(0) + '***', // Only show first letter
        email: participant.email.split('@')[0].charAt(0) + '***@' + participant.email.split('@')[1], // Hide most of email
        registeredAt: participant.registeredAt
      }
    });
  } catch (error) {
    console.error('Error in debug test-results route:', error);
    return NextResponse.json(
      { error: 'Failed to get test results: ' + error.message },
      { status: 500 }
    );
  }
} 