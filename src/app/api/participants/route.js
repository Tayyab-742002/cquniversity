import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';

export async function POST(request) {
  try {
    // Connect to the database
    await connectToDatabase();
    
    // Get participant data from request body
    const requestData = await request.json();
    console.log('Received registration data:', requestData);
    
    // Validate required fields (using frontend field names)
    const requiredFields = ['name', 'email', 'age', 'gender', 'education', 'ipAddress'];
    const missingFields = requiredFields.filter(field => !requestData[field]);
    
    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Map frontend field names to database field names and normalize values
    const participantData = {
      name: requestData.name,
      email: requestData.email,
      age: requestData.age,
      gender: requestData.gender === 'prefer not to say' ? 'prefer-not-to-say' : requestData.gender,
      educationLevel: normalizeEducationLevel(requestData.education),
      ipAddress: requestData.ipAddress
    };
    
    console.log('Mapped participant data:', participantData);
    
    // Helper function to normalize education level values
    function normalizeEducationLevel(education) {
      const educationMap = {
        'high school': 'high-school',
        'high-school': 'high-school',
        'bachelor': 'bachelors',
        'bachelors': 'bachelors',
        "bachelor's": 'bachelors',
        "bachelor's degree": 'bachelors',
        'master': 'masters',
        'masters': 'masters',
        "master's": 'masters',
        "master's degree": 'masters',
        'phd': 'doctorate',
        'doctorate': 'doctorate',
        'other': 'other'
      };
      
      const normalized = education.toLowerCase().trim();
      return educationMap[normalized] || normalized.replace(/\s+/g, '-');
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