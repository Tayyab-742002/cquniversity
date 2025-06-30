import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';

export async function POST(request) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Get IP address from request body
    const { ipAddress } = await request.json();
    
    if (!ipAddress) {
      return NextResponse.json(
        { error: 'IP address is required' },
        { status: 400 }
      );
    }
    
    // Check if participant with this IP already exists
    const existingParticipant = await Participant.findOne({ ipAddress });
    
    return NextResponse.json({
      exists: !!existingParticipant,
      participant: existingParticipant ? {
        id: existingParticipant._id,
        name: existingParticipant.name,
        completedTests: {
          stroopTest: existingParticipant.testResults?.stroopTest?.completed || false,
          trailMakingTest: existingParticipant.testResults?.trailMakingTest?.completed || false,
          corsiBlocksTest: existingParticipant.testResults?.corsiBlocksTest?.completed || false,
          fivePointsTest: existingParticipant.testResults?.fivePointsTest?.completed || false,
        }
      } : null
    });
  } catch (error) {
    console.error('Error checking IP:', error);
    return NextResponse.json(
      { error: 'Failed to check IP address' },
      { status: 500 }
    );
  }
} 