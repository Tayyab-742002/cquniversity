import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';

/**
 * Debug API endpoint to list all participants with test results
 * @returns {Promise<NextResponse>} Response with participants data
 */
export async function GET() {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Find all participants
    const participants = await Participant.find({});
    
    // Map participants to a sanitized format
    const sanitizedParticipants = participants.map(participant => {
      const hasTestResults = participant.testResults && participant.testResults.length > 0;
      
      return {
        id: participant._id,
        name: participant.name.charAt(0) + '***', // Only show first letter
        email: participant.email.split('@')[0].charAt(0) + '***@' + participant.email.split('@')[1], // Hide most of email
        registeredAt: participant.registeredAt,
        hasTestResults,
        testResultsCount: hasTestResults ? participant.testResults.length : 0,
        testIds: hasTestResults ? participant.testResults.map(result => result.testId) : []
      };
    });
    
    return NextResponse.json({
      count: sanitizedParticipants.length,
      participants: sanitizedParticipants
    });
  } catch (error) {
    console.error('Error in debug participants route:', error);
    return NextResponse.json(
      { error: 'Failed to get participants: ' + error.message },
      { status: 500 }
    );
  }
} 