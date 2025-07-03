import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';

/**
 * API endpoint to check participant data (for debugging only)
 * @returns {Promise<NextResponse>} Response with participant data
 */
export async function GET(request) {
  try {
    // Check if user is authenticated
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Get participant ID from query params
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('id');
    const clerkId = searchParams.get('clerkId');
    
    if (!participantId && !clerkId) {
      return NextResponse.json(
        { error: 'Participant ID or Clerk ID is required' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Find participant
    let participant;
    if (clerkId) {
      participant = await Participant.findOne({ clerkId });
    } else {
      participant = await Participant.findById(participantId);
    }
    
    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }
    
    // Return participant data (sanitized for privacy)
    const sanitizedParticipant = {
      id: participant._id,
      clerkId: participant.clerkId,
      firstName: participant.firstName?.charAt(0) + '***', // Only show first letter
      lastName: participant.lastName?.charAt(0) + '***',
      fullName: participant.fullName,
      age: participant.age,
      gender: participant.gender,
      email: participant.email?.split('@')[0].charAt(0) + '***@' + participant.email?.split('@')[1], // Hide most of email
      education: participant.education,
      studyStatus: participant.studyStatus,
      createdAt: participant.createdAt,
      lastLoginAt: participant.lastLoginAt,
      hasTestResults: participant.testResults && participant.testResults.length > 0,
      testResultsCount: participant.testResults ? participant.testResults.length : 0,
      completedTests: participant.testsCompleted || [],
      testResultsIds: participant.testResults ? participant.testResults.map(result => result.testId) : []
    };
    
    return NextResponse.json({
      participant: sanitizedParticipant,
      debug: {
        timestamp: new Date().toISOString(),
        authMethod: 'Clerk',
        requestedBy: userId
      }
    });
  } catch (error) {
    console.error('Error in debug route:', error);
    return NextResponse.json(
      { error: 'Failed to get participant data: ' + error.message },
      { status: 500 }
    );
  }
} 