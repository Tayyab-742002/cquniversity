import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';

/**
 * API endpoint to check if a participant has completed a specific test
 * @param {Request} request - The request object
 * @returns {Promise<NextResponse>} Response with test result or null
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const participantId = searchParams.get('participantId');
  const testId = searchParams.get('testId');
  
  if (!participantId || !testId) {
    return NextResponse.json(
      { error: 'Participant ID and test ID are required' },
      { status: 400 }
    );
  }
  
  try {
    await connectToDatabase();
    
    // Find participant
    const participant = await Participant.findById(participantId);
    
    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      );
    }
    
    // Find test result
    const testResult = participant.testResults.find(
      result => result.testId === testId
    );
    
    return NextResponse.json({ result: testResult || null });
  } catch (error) {
    console.error('Error checking test result:', error);
    return NextResponse.json(
      { error: 'Failed to check test result' },
      { status: 500 }
    );
  }
} 