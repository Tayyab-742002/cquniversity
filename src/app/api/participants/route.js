import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';

export async function POST(request) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Get participant data from request body
    const participantData = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'age', 'gender', 'education', 'ipAddress'];
    const missingFields = requiredFields.filter(field => !participantData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Check if participant with this IP already exists
    const existingParticipant = await Participant.findOne({ 
      ipAddress: participantData.ipAddress 
    });
    
    if (existingParticipant) {
      return NextResponse.json(
        { error: 'A participant with this IP address has already registered' },
        { status: 409 }  // Conflict status code
      );
    }
    
    // Create new participant
    const participant = await Participant.create(participantData);
    
    return NextResponse.json({
      success: true,
      participant: {
        id: participant._id,
        name: participant.name,
        email: participant.email
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error registering participant:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: validationErrors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to register participant' },
      { status: 500 }
    );
  }
} 