import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';

export async function POST(request) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Get device data from request body
    const { deviceId, deviceFingerprint, confidence } = await request.json();
    
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }
    
    console.log('🔍 Checking device registration:', {
      deviceId: deviceId.substring(0, 8) + '...',
      confidence: confidence
    });
    
    // Check if participant with this device ID already exists
    const existingParticipant = await Participant.findOne({ deviceId });
    
    if (existingParticipant) {
      console.log('⚠️ Device already registered:', {
        participantId: existingParticipant._id,
        name: existingParticipant.name
      });
      
      // Get completed tests
      const completedTests = existingParticipant.testResults || [];
      const testStatus = {
        stroopTest: completedTests.some(test => test.testId === 'stroopTest'),
        trailMakingTest: completedTests.some(test => test.testId === 'trailMakingTest'),
        corsiBlocksTest: completedTests.some(test => test.testId === 'corsiBlocksTest'),
        fivePointsTest: completedTests.some(test => test.testId === 'fivePointsTest'),
      };
      
      return NextResponse.json({
        exists: true,
        participant: {
          id: existingParticipant._id,
          name: existingParticipant.name,
          email: existingParticipant.email,
          registeredAt: existingParticipant.registeredAt,
          completedTests: testStatus,
          deviceConfidence: existingParticipant.fingerprintConfidence || 0
        }
      });
    }
    
    console.log('✅ Device not registered - new user allowed');
    
    return NextResponse.json({
      exists: false,
      participant: null,
      deviceId: deviceId,
      confidence: confidence
    });
    
  } catch (error) {
    console.error('Error checking device registration:', error);
    return NextResponse.json(
      { error: 'Failed to check device registration' },
      { status: 500 }
    );
  }
} 