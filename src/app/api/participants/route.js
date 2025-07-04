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
      googleId,
      participantCode,
      userType
    } = body;

    console.log('📥 Received registration data:', { 
      firstName, 
      lastName, 
      email, 
      age, 
      gender, 
      education, 
      participantCode, 
      userType 
    });

    // Validate required fields
    if (!firstName || !lastName || !email || !age || !gender || !education) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate participant code for research participants
    if (userType === 'research') {
      if (!participantCode || participantCode.length !== 8) {
        console.log('❌ Invalid participant code for research participant:', participantCode);
        return NextResponse.json(
          { error: 'Research participants must provide a valid 8-character participant code' },
          { status: 400 }
        );
      }
      console.log('✅ Valid participant code for research participant:', participantCode);
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
          studyStatus: existingParticipant.studyStatus,
          userType: existingParticipant.userType,
          participantCode: existingParticipant.participantCode
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

    // Check for existing participant code (for research participants)
    if (userType === 'research' && participantCode) {
      const existingByCode = await Participant.findOne({ participantCode: participantCode.toUpperCase() });
      if (existingByCode) {
        return NextResponse.json({
          error: 'PARTICIPANT_CODE_EXISTS',
          message: 'This participant code is already in use.'
        }, { status: 409 });
      }
    }

    // Create new participant with Clerk integration
    const participantData = {
      clerkId: userId,
      firstName,
      lastName,
      email,
      age: parseInt(age),
      gender,
      education,
      profileImageUrl: profileImageUrl || null,
      googleId: googleId || null,
      userType: userType || 'general',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      testsCompleted: [],
      studyStatus: 'registered'
    };

    // Add participant code for research participants
    if (userType === 'research' && participantCode) {
      participantData.participantCode = participantCode.toUpperCase();
      console.log('🏷️ Adding participant code to data:', participantCode.toUpperCase());
    }

    console.log('💾 Final participant data before saving:', participantData);

    const participant = new Participant(participantData);
    const savedParticipant = await participant.save();

    console.log('✅ Successfully saved participant:', {
      id: savedParticipant._id,
      email: savedParticipant.email,
      userType: savedParticipant.userType,
      participantCode: savedParticipant.participantCode
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
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
      if (error.keyPattern?.participantCode) {
        return NextResponse.json({
          error: 'PARTICIPANT_CODE_EXISTS',
          message: 'This participant code is already in use.'
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
          testsCompleted: participant.testsCompleted?.length || 0,
          userType: participant.userType,
          participantCode: participant.participantCode
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
        testResults: participant.testResults,
        userType: participant.userType,
        participantCode: participant.participantCode
      }
    });

  } catch (error) {
    console.error('❌ GET participants error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participant data', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
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
      googleId,
      participantCode,
      userType
    } = body;

    console.log('📥 Received profile update data:', { 
      firstName, 
      lastName, 
      email, 
      age, 
      gender, 
      education, 
      participantCode, 
      userType 
    });

    // Validate required fields
    if (!firstName || !lastName || !email || !age || !gender || !education) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find existing participant
    const existingParticipant = await Participant.findOne({ clerkId: userId });
    
    if (!existingParticipant) {
      return NextResponse.json({
        error: 'PARTICIPANT_NOT_FOUND',
        message: 'No existing participant found to update.'
      }, { status: 404 });
    }

    console.log('🔍 Found existing participant to update:', {
      id: existingParticipant._id,
      currentCode: existingParticipant.participantCode,
      currentType: existingParticipant.userType
    });

    // Update participant data
    const updateData = {
      firstName,
      lastName,
      email,
      age: parseInt(age),
      gender,
      education,
      profileImageUrl: profileImageUrl || existingParticipant.profileImageUrl,
      googleId: googleId || existingParticipant.googleId,
      lastLoginAt: new Date()
    };

    // Keep existing participant code and type if they exist
    if (existingParticipant.participantCode) {
      updateData.participantCode = existingParticipant.participantCode;
    }
    if (existingParticipant.userType) {
      updateData.userType = existingParticipant.userType;
    }

    console.log('💾 Final update data:', updateData);

    const updatedParticipant = await Participant.findByIdAndUpdate(
      existingParticipant._id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('✅ Successfully updated participant:', {
      id: updatedParticipant._id,
      email: updatedParticipant.email,
      userType: updatedParticipant.userType,
      participantCode: updatedParticipant.participantCode
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      participant: {
        id: updatedParticipant._id,
        clerkId: userId,
        email: updatedParticipant.email,
        fullName: updatedParticipant.fullName,
        studyStatus: updatedParticipant.studyStatus,
        userType: updatedParticipant.userType,
        participantCode: updatedParticipant.participantCode
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Profile update error:', error);
    return NextResponse.json(
      { error: 'Profile update failed', details: error.message },
      { status: 500 }
    );
  }
} 