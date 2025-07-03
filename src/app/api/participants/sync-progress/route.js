import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';

/**
 * API endpoint to sync participant study progress with existing test results
 * This is needed for participants who completed tests before progress tracking was implemented
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

    await connectToDatabase();
    
    // Find the participant
    const participant = await Participant.findOne({ clerkId: userId });
    
    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Get all completed test IDs from testResults
    const completedTestIds = [];
    if (participant.testResults && participant.testResults.length > 0) {
      participant.testResults.forEach(result => {
        if (result.testId && !completedTestIds.includes(result.testId)) {
          completedTestIds.push(result.testId);
        }
      });
    }

    // Update testsCompleted array
    participant.testsCompleted = completedTestIds;

    // Update study status based on completed tests
    const totalTests = 4; // stroopTest, trailMakingTest, corsiBlocksTest, fivePointsTest
    const completedCount = completedTestIds.length;
    
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
      message: 'Study progress synced successfully',
      participant: {
        id: participant._id,
        testsCompleted: participant.testsCompleted,
        studyStatus: participant.studyStatus,
        completedCount: completedCount,
        totalTests: totalTests,
        syncedTests: completedTestIds
      }
    });

  } catch (error) {
    console.error('❌ Study progress sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync study progress', details: error.message },
      { status: 500 }
    );
  }
} 