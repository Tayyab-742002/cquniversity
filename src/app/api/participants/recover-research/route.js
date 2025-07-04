import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';

export async function POST(request) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { participantCode, email } = body;

    console.log('🔄 Attempting to recover research participant:', { userId, participantCode, email });

    // Validate required fields
    if (!participantCode || !email) {
      return NextResponse.json(
        { error: 'Participant code and email are required' },
        { status: 400 }
      );
    }

    // Validate participant code format
    if (participantCode.length !== 8) {
      return NextResponse.json(
        { error: 'Participant code must be exactly 8 characters' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if participant already exists in database
    const existingParticipant = await Participant.findOne({ 
      $or: [
        { clerkId: userId },
        { email: email.toLowerCase() },
        { participantCode: participantCode.toUpperCase() }
      ]
    });

    if (existingParticipant) {
      console.log('⚠️ Participant already exists:', existingParticipant._id);
      return NextResponse.json({
        success: true,
        recovered: false,
        message: 'Participant record already exists',
        participant: {
          id: existingParticipant._id,
          email: existingParticipant.email,
          participantCode: existingParticipant.participantCode,
          userType: existingParticipant.userType
        }
      });
    }

    // Create the missing participant record
    const participantData = {
      clerkId: userId,
      firstName: 'Research', // Temporary, will be updated
      lastName: 'Participant', // Temporary, will be updated  
      email: email.toLowerCase(),
      age: 18, // Temporary, will be updated
      gender: 'prefer-not-to-say', // Temporary, will be updated
      education: 'other', // Temporary, will be updated
      userType: 'research',
      participantCode: participantCode.toUpperCase(),
      profileImageUrl: null,
      googleId: null,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      testsCompleted: [],
      studyStatus: 'registered'
    };

    console.log('📝 Creating recovered participant record:', participantData);

    const participant = new Participant(participantData);
    const savedParticipant = await participant.save();

    console.log('✅ Successfully recovered participant:', {
      id: savedParticipant._id,
      email: savedParticipant.email,
      participantCode: savedParticipant.participantCode
    });

    return NextResponse.json({
      success: true,
      recovered: true,
      message: 'Participant record recovered successfully',
      participant: {
        id: savedParticipant._id,
        clerkId: userId,
        email: savedParticipant.email,
        fullName: savedParticipant.fullName,
        studyStatus: savedParticipant.studyStatus,
        userType: savedParticipant.userType,
        participantCode: savedParticipant.participantCode
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Recovery error:', error);
    
    if (error.code === 11000) {
      // Duplicate key error
      return NextResponse.json({
        error: 'DUPLICATE_RECORD',
        message: 'A participant with this information already exists.'
      }, { status: 409 });
    }
    
    return NextResponse.json(
      { error: 'Recovery failed', details: error.message },
      { status: 500 }
    );
  }
} 