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

    // Extract participant data
    const { 
      firstName, 
      lastName, 
      email, 
      age, 
      gender,
      education,
      profileImageUrl,
      googleId
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !age || !gender || !education) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user is already registered
    const existingParticipant = await Participant.findOne({ clerkId: userId });
    
    if (existingParticipant) {

      return NextResponse.json({
        error: 'USER_ALREADY_REGISTERED',
        message: 'You have already registered for this study.',
        participant: {
          id: existingParticipant._id,
          email: existingParticipant.email,
          registeredAt: existingParticipant.createdAt,
          studyStatus: existingParticipant.studyStatus
        }
      }, { status: 409 });
    }

    // Check for existing email (in case of account switching)
    const existingByEmail = await Participant.findOne({ email });
    if (existingByEmail) {
   
      return NextResponse.json({
        error: 'EMAIL_ALREADY_REGISTERED', 
        message: 'An account with this email already exists.'
      }, { status: 409 });
    }

    // Create new participant with Clerk integration
    const participant = new Participant({
      clerkId: userId,
      firstName,
      lastName,
      email,
      age: parseInt(age),
      gender,
      education,
      profileImageUrl: profileImageUrl || null,
      googleId: googleId || null,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      testsCompleted: [],
      studyStatus: 'registered'
    });

    const savedParticipant = await participant.save();



    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      participant: {
        id: savedParticipant._id,
        clerkId: userId,
        email: savedParticipant.email,
        fullName: savedParticipant.fullName,
        studyStatus: savedParticipant.studyStatus
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      if (error.keyPattern?.email) {
        return NextResponse.json({
          error: 'EMAIL_ALREADY_REGISTERED',
          message: 'An account with this email already exists.'
        }, { status: 409 });
      }
      if (error.keyPattern?.clerkId) {
        return NextResponse.json({
          error: 'USER_ALREADY_REGISTERED',
          message: 'You have already registered for this study.'
        }, { status: 409 });
      }
    }

    return NextResponse.json(
      { error: 'Registration failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const clerkId = url.searchParams.get('clerkId');

    // If specific user is requested
    if (clerkId || email) {
      const searchCriteria = clerkId ? { clerkId } : { email };
      const participant = await Participant.findOne(searchCriteria);
      
      if (!participant) {
        return NextResponse.json({ 
          registered: false, 
          message: 'User not registered' 
        });
      }
      
      return NextResponse.json({ 
        registered: true, 
        participant: {
          id: participant._id,
          clerkId: participant.clerkId,
          email: participant.email,
          fullName: participant.fullName,
          studyStatus: participant.studyStatus,
          registeredAt: participant.createdAt,
          testsCompleted: participant.testsCompleted?.length || 0
        }
      });
    }

    // Get current user's participant record
    const participant = await Participant.findOne({ clerkId: userId });
    
    if (!participant) {
      return NextResponse.json({ 
        registered: false, 
        message: 'User not registered' 
      });
    }

    return NextResponse.json({
      registered: true,
      participant: {
        id: participant._id,
        clerkId: participant.clerkId,
        email: participant.email,
        fullName: participant.fullName,
        age: participant.age,
        gender: participant.gender,
        education: participant.education,
        studyStatus: participant.studyStatus,
        registeredAt: participant.createdAt,
        testsCompleted: participant.testsCompleted,
        testResults: participant.testResults
      }
    });

  } catch (error) {
    console.error('❌ GET participants error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participant data' },
      { status: 500 }
    );
  }
} 