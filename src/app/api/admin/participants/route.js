import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';
import { withAdminAuth } from '@/lib/adminAuth';

async function getParticipants() {
  try {
    await connectToDatabase();
    
    // Get all participants with their test results
    const participants = await Participant.find({}).lean();
    
    // Format participants data for admin view
    const formattedParticipants = participants.map(participant => {
      const testResults = participant.testResults || [];
      const completedTests = testResults.map(result => result.testId);
      
      return {
        id: participant._id.toString(),
        name: participant.name,
        email: participant.email,
        age: participant.age,
        gender: participant.gender,
        educationLevel: participant.educationLevel,
        ipAddress: participant.ipAddress,
        registeredAt: participant.registeredAt,
        completedTests,
        testResults: testResults.map(result => ({
          testId: result.testId,
          completedAt: result.completedAt,
          metrics: result.metrics,
          rawData: result.rawData
        }))
      };
    });
    
    return NextResponse.json({
      participants: formattedParticipants,
      count: formattedParticipants.length
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(getParticipants); 