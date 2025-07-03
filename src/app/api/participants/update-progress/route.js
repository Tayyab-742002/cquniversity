import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';

/**
 * API endpoint to update participant study progress
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} Response with updated participant data
 */
export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { participantId, testId } = body;
    
    if (!participantId || !testId) {
      return NextResponse.json(
        { error: 'Participant ID and test ID are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    
    // Find participant
    const participant = await Participant.findById(participantId);
    
    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Verify the request is for the authenticated user
    if (participant.clerkId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Access denied' },
        { status: 403 }
      );
    }

    // Initialize testsCompleted array if it doesn't exist
    if (!participant.testsCompleted) {
      participant.testsCompleted = [];
    }

    // Add testId to testsCompleted if not already present
    if (!participant.testsCompleted.includes(testId)) {
      participant.testsCompleted.push(testId);
    }

    // Update study status based on completed tests
    const totalTests = 4; // stroopTest, trailMakingTest, corsiBlocksTest, fivePointsTest
    const completedCount = participant.testsCompleted.length;
    
    let newStudyStatus = 'registered';
    if (completedCount > 0 && completedCount < totalTests) {
      newStudyStatus = 'in-progress';
    } else if (completedCount >= totalTests) {
      newStudyStatus = 'completed';
    }

    participant.studyStatus = newStudyStatus;

    // Save the updated participant
    await participant.save();


    return NextResponse.json({
      success: true,
      message: 'Study progress updated successfully',
      participant: {
        id: participant._id,
        testsCompleted: participant.testsCompleted,
        studyStatus: participant.studyStatus,
        completedCount: completedCount,
        totalTests: totalTests
      }
    });

  } catch (error) {
    console.error('❌ Study progress update error:', error);
    return NextResponse.json(
      { error: 'Failed to update study progress', details: error.message },
      { status: 500 }
    );
  }
} 