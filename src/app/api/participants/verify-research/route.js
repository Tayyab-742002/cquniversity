import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const participantCode = url.searchParams.get('participantCode');
    // Validate required parameters
    if (!email || !participantCode) {
      return NextResponse.json(
        { error: 'Email and participant code are required', exists: false },
        { status: 400 }
      );
    }

    // Validate participant code format
    if (participantCode.length !== 8) {
      return NextResponse.json(
        { error: 'Participant code must be exactly 8 characters', exists: false },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if research participant exists with this email and participant code combination
    const participant = await Participant.findOne({
      email: email.toLowerCase(),
      participantCode: participantCode.toUpperCase(),
      userType: 'research'
    });



    if (participant) {
      return NextResponse.json({
        exists: true,
        participant: {
          id: participant._id,
          fullName: participant.fullName,
          email: participant.email,
          participantCode: participant.participantCode,
          studyStatus: participant.studyStatus
        }
      });
    } else {
      return NextResponse.json({
        exists: false,
        message: 'No research participant found with this email and participant code combination'
      });
    }

  } catch (error) {
    console.error('❌ Research participant verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed', details: error.message, exists: false },
      { status: 500 }
    );
  }
} 