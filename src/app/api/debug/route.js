import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';

/**
 * API endpoint to check participant data (for debugging only)
 * @returns {Promise<NextResponse>} Response with participant data
 */
export async function GET(request) {
  try {
    // Get participant ID from query params
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('id');
    
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
    
    // Return participant data (sanitized)
    const sanitizedParticipant = {
      id: participant._id,
      name: participant.name.charAt(0) + '***', // Only show first letter
      age: participant.age,
      gender: participant.gender,
      email: participant.email.split('@')[0].charAt(0) + '***@' + participant.email.split('@')[1], // Hide most of email
      educationLevel: participant.educationLevel,
      registeredAt: participant.registeredAt,
      hasTestResults: participant.testResults && participant.testResults.length > 0,
      testResultsCount: participant.testResults ? participant.testResults.length : 0,
      testResultsIds: participant.testResults ? participant.testResults.map(result => result.testId) : []
    };
    
    return NextResponse.json({
      participant: sanitizedParticipant
    });
  } catch (error) {
    console.error('Error in debug route:', error);
    return NextResponse.json(
      { error: 'Failed to get participant data: ' + error.message },
      { status: 500 }
    );
  }
} 