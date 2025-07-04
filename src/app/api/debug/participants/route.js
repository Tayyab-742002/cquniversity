import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';

/**
 * Debug API endpoint to list all participants with test results
 * @returns {Promise<NextResponse>} Response with participants data
 */
export async function GET(request) {
  try {
    await connectToDatabase();
    
    // Get all participants (limit to prevent overwhelming response)
    const participants = await Participant.find({}, {
      firstName: 1,
      lastName: 1,
      email: 1,
      participantCode: 1,
      userType: 1,
      studyStatus: 1,
      createdAt: 1
    }).limit(20).sort({ createdAt: -1 });

    console.log('📋 All participants in database:');
    participants.forEach(p => {
      console.log(`- ${p.fullName} (${p.email}) - Code: ${p.participantCode || 'N/A'} - Type: ${p.userType} - Status: ${p.studyStatus}`);
    });
    
    return NextResponse.json({
      success: true,
      count: participants.length,
      participants: participants.map(p => ({
        id: p._id,
        fullName: p.fullName,
        email: p.email,
        participantCode: p.participantCode,
        userType: p.userType,
        studyStatus: p.studyStatus,
        createdAt: p.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Debug participants error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants', details: error.message },
      { status: 500 }
    );
  }
} 