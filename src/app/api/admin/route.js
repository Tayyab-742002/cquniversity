import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';

// Admin token from environment variable
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'psyco-admin-secure-2024-x9k7m';

export async function POST(request) {
  try {
    const { action, token, participantId } = await request.json();

    // Validate admin token
    if (!token || token !== ADMIN_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin token' },
        { status: 401 }
      );
    }

    if (action === 'login') {
      // Connect to database
      await connectToDatabase();

      // Fetch all participants
      const participants = await Participant.find({})
        .select('-__v')
        .sort({ registeredAt: -1 })
        .lean();

      // Calculate statistics
      const stats = calculateStatistics(participants);

      // Format participants data
      const formattedParticipants = participants.map(participant => ({
        id: participant._id.toString(),
        name: participant.firstName + " " + participant.lastName,
        email: participant.email,
        age: participant.age,
        gender: participant.gender,
        education: participant.education,
        studyStatus: participant.studyStatus,
        testsCompleted: participant.testsCompleted?.length || 0,
        registeredAt: participant.createdAt
      }));

      return NextResponse.json({
        success: true,
        data: {
          stats,
          participants: formattedParticipants
        }
      });
    }

    if (action === 'export') {
      // Connect to database
      await connectToDatabase();

      // Fetch all participants with test results
      const participants = await Participant.find({})
        .select('-__v')
        .sort({ registeredAt: -1 })
        .lean();

      // Generate CSV content
      const csvContent = generateCSV(participants);

      // Return CSV response
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="psycotest_export_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    if (action === 'participant-details') {
      if (!participantId) {
        return NextResponse.json(
          { success: false, error: 'Participant ID is required' },
          { status: 400 }
        );
      }

      // Connect to database
      await connectToDatabase();

      // Fetch specific participant with all details
      const participant = await Participant.findById(participantId)
        .select('-__v')
        .lean();

      if (!participant) {
        return NextResponse.json(
          { success: false, error: 'Participant not found' },
          { status: 404 }
        );
      }
      // Format participant data with complete information
      const formattedParticipant = {
        id: participant._id.toString(),
        name: participant.firstName + " " + participant.lastName,
        email: participant.email,
        age: participant.age,
        gender: participant.gender,
        education: participant.education,
        studyStatus: participant.studyStatus,
        testsCompleted: participant.testsCompleted || [],
        testResults: participant.testResults || [],
        registeredAt: participant.createdAt,
        // Include any additional fields that might be useful
        ...participant
      };

      return NextResponse.json({
        success: true,
        participant: formattedParticipant
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateStatistics(participants) {
  const totalParticipants = participants.length;
  
  // Calculate total completed tests
  let completedTests = 0;
  const testTypes = {};
  const genderBreakdown = {};
  const educationBreakdown = {};
  let totalAge = 0;
  let ageCount = 0;
  
  // Today's date for filtering today's tests
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let todaysTests = 0;

  participants.forEach(participant => {
    // Count completed tests
    if (participant.testResults && Array.isArray(participant.testResults)) {
      const testCount = participant.testResults.length;
      completedTests += testCount;

      // Count today's tests
      participant.testResults.forEach(result => {
        const resultDate = new Date(result.completedAt || result.timestamp);
        if (resultDate >= today) {
          todaysTests++;
        }

        // Count by test type
        const testId = result.testId;
        testTypes[testId] = (testTypes[testId] || 0) + 1;
      });
    }

    // Gender breakdown
    const gender = participant.gender || 'unknown';
    genderBreakdown[gender] = (genderBreakdown[gender] || 0) + 1;

    // Education breakdown
    const education = participant.education || 'unknown';
    educationBreakdown[education] = (educationBreakdown[education] || 0) + 1;

    // Age calculation
    if (participant.age && !isNaN(participant.age)) {
      totalAge += parseInt(participant.age);
      ageCount++;
    }
  });

  const averageAge = ageCount > 0 ? Math.round(totalAge / ageCount) : 0;

  return {
    totalParticipants,
    completedTests,
    averageAge,
    todaysTests,
    testTypes,
    genderBreakdown,
    educationBreakdown
  };
}

function generateCSV(participants) {
  const headers = [
    'Participant ID',
    'Name',
    'Email',
    'Age',
    'Gender',
    'Education',
    'Study Status',
    'Registration Date',
    'Tests Completed Count',
    'Tests Completed List',
    'Test Results'
  ];

  const rows = participants.map(participant => {
    const testsCompleted = participant.testsCompleted || [];
    const testResults = participant.testResults || [];
    
    // Format test results as JSON string for CSV
    const testResultsString = JSON.stringify(testResults.map(result => ({
      testId: result.testId,
      completedAt: result.completedAt || result.timestamp,
      metrics: result.metrics
    })));

    return [
      participant._id.toString(),
      participant.name || '',
      participant.email || '',
      participant.age || '',
      participant.gender || '',
      participant.education || '',
      participant.studyStatus || '',
      participant.registeredAt ? new Date(participant.registeredAt).toISOString() : '',
      testsCompleted.length.toString(),
      testsCompleted.join('; '),
      testResultsString.replace(/"/g, '""') // Escape quotes for CSV
    ];
  });

  // Combine headers and rows
  const csvLines = [
    headers.map(header => `"${header}"`).join(','),
    ...rows.map(row => row.map(field => `"${field}"`).join(','))
  ];

  return csvLines.join('\n');
} 