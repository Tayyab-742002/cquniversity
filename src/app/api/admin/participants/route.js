import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';

export async function GET() {
  try {
    // Check authentication (you might want to add admin role checking here)
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const participants = await Participant.find({})
      .select('clerkId firstName lastName email age gender education studyStatus createdAt lastLoginAt testsCompleted testResults')
      .sort({ createdAt: -1 })
      .lean();
    
    const processedParticipants = participants.map(participant => ({
      _id: participant._id,
      clerkId: participant.clerkId,
      fullName: `${participant.firstName} ${participant.lastName}`,
      email: participant.email,
      age: participant.age,
      gender: participant.gender,
      education: participant.education,
      studyStatus: participant.studyStatus,
      registeredAt: participant.createdAt,
      lastLoginAt: participant.lastLoginAt,
      testsCompleted: participant.testsCompleted?.length || 0,
      testResultsCount: participant.testResults?.length || 0,
      authMethod: 'Google (Clerk)'
    }));
    
    return NextResponse.json({
      participants: processedParticipants,
      total: processedParticipants.length,
      summary: {
        totalParticipants: processedParticipants.length,
        registered: processedParticipants.filter(p => p.studyStatus === 'registered').length,
        inProgress: processedParticipants.filter(p => p.studyStatus === 'in-progress').length,
        completed: processedParticipants.filter(p => p.studyStatus === 'completed').length,
        withdrawn: processedParticipants.filter(p => p.studyStatus === 'withdrawn').length,
        avgTestsCompleted: processedParticipants.reduce((sum, p) => sum + p.testsCompleted, 0) / processedParticipants.length || 0
      }
    });
  } catch (error) {
    console.error('Admin participants fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: 500 }
    );
  }
} 