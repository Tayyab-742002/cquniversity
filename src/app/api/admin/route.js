import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';

// Admin token from environment variable
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// Simple GET handler for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Admin API is working', 
    timestamp: new Date().toISOString() 
  });
}

export async function POST(request) {
  try {
   
    
    const body = await request.json();
    const { action, token, participantId, filterType } = body;
    


    // Test action for debugging
    if (action === 'test') {
      return NextResponse.json({ 
        success: true, 
        message: 'Admin API POST is working',
        receivedData: { action, hasToken: !!token }
      });
    }

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
    

      // Fetch all participants without confidential data
      const participants = await Participant.find({})
        .select('-__v -clerkId -googleId') // Exclude confidential fields
        .sort({ createdAt: -1 })
        .lean();

    

      const stats = calculateStatistics(participants);

      // Format participants data without exposing confidential information
      const formattedParticipants = participants.map((participant, index) => ({
        id: generateConsistentAnonymousId(participant),
        name: participant.firstName + " " + participant.lastName,
        email: participant.email,
        age: participant.age,
        gender: participant.gender,
        education: participant.education,
        studyStatus: participant.studyStatus,
        userType: participant.userType || 'general',
        participantCode: participant.participantCode || null,
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

    if (action === 'export-data') {
      // Connect to database
      await connectToDatabase();

      // Fetch all participants with only non-confidential data
      const participants = await Participant.find({})
        .select('-__v -clerkId -googleId') // Exclude confidential fields
        .sort({ createdAt: -1 })
        .lean();

      // Filter participants based on filterType
      let filteredParticipants = participants;
      if (filterType === 'research') {
        filteredParticipants = participants.filter(p => p.userType === 'research');
      } else if (filterType === 'public') {
        filteredParticipants = participants.filter(p => p.userType === 'general' || !p.userType);
      }

      // Helper function to format dates consistently
      const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        });
      };

      // Helper function to format time
      const formatDateTime = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      // Helper function to safely escape CSV fields
      const escapeCSVField = (field) => {
        if (field === null || field === undefined) return '';
        const str = field.toString();
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Generate unique anonymous participant ID for research tracking
      const generateAnonymousId = (participant, index) => {
        return generateConsistentAnonymousId(participant);
      };

      // Create comprehensive CSV headers
      const csvHeaders = [
        'Anonymous ID',
        'User Type', 
        'Participant Code',
        'Age',
        'Gender',
        'Education Level',
        'Study Status',
        'Registration Date',
        'Last Activity',
        'Tests Completed Count',
        'Tests Completed List',
        'Stroop Test Completed',
        'Trail Making Test Completed', 
        'Corsi Blocks Test Completed',
        'Five Points Test Completed',
        'Study Progress (%)',
        'Days Since Registration',
        'Test Results Summary'
      ];

      // Map participants to CSV rows with proper formatting
      const csvRows = filteredParticipants.map((participant, index) => {
        const testResults = participant.testResults || [];
        const testsCompleted = participant.testsCompleted || [];
        const totalTests = 4; // Number of available tests
        const progressPercentage = Math.round((testsCompleted.length / totalTests) * 100);
        
        // Calculate days since registration
        const daysSinceRegistration = participant.createdAt 
          ? Math.floor((new Date() - new Date(participant.createdAt)) / (1000 * 60 * 60 * 24))
          : 0;

        // Format education level for readability
        const formatEducation = (education) => {
          const educationMap = {
            'high-school': 'High School',
            'bachelors': 'Bachelor\'s Degree',
            'masters': 'Master\'s Degree', 
            'doctorate': 'Doctorate',
            'other': 'Other'
          };
          return educationMap[education] || education || '';
        };

        // Format gender for readability
        const formatGender = (gender) => {
          const genderMap = {
            'male': 'Male',
            'female': 'Female',
            'other': 'Other',
            'prefer-not-to-say': 'Prefer not to say'
          };
          return genderMap[gender] || gender || '';
        };

        // Format study status
        const formatStudyStatus = (status) => {
          const statusMap = {
            'registered': 'Registered',
            'in-progress': 'In Progress',
            'completed': 'Completed',
            'withdrawn': 'Withdrawn'
          };
          return statusMap[status] || status || 'Registered';
        };

        // Create test results summary
        const testResultsSummary = testResults.length > 0 
          ? `${testResults.length} test(s) completed`
          : 'No tests completed';

        return [
          generateAnonymousId(participant, index),
          participant.userType === 'research' ? 'Research Participant' : 'Public Participant',
          participant.participantCode || 'N/A',
          participant.age || '',
          formatGender(participant.gender),
          formatEducation(participant.education),
          formatStudyStatus(participant.studyStatus),
          formatDate(participant.createdAt),
          formatDateTime(participant.lastLoginAt),
          testsCompleted.length,
          testsCompleted.length > 0 ? testsCompleted.join(', ') : 'None',
          testsCompleted.includes('stroopTest') ? 'Yes' : 'No',
          testsCompleted.includes('trailMakingTest') ? 'Yes' : 'No',
          testsCompleted.includes('corsiBlocksTest') ? 'Yes' : 'No',
          testsCompleted.includes('fivePointsTest') ? 'Yes' : 'No',
          `${progressPercentage}%`,
          daysSinceRegistration,
          testResultsSummary
        ].map(escapeCSVField);
      });

      // Create properly formatted CSV content
      const csvContent = [
        csvHeaders.map(escapeCSVField).join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      // Add UTF-8 BOM for proper Excel compatibility
      const csvWithBOM = '\uFEFF' + csvContent;

      return new Response(csvWithBOM, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="psycotest_${filterType}_participants_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.csv"`
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

      await connectToDatabase();

      let participant;
      
      // Handle different ID formats
      if (participantId.startsWith('R-')) {
        // Research participant - search by participant code
        const participantCode = participantId.replace('R-', '');
        participant = await Participant.findOne({ participantCode: participantCode })
          .select('-__v -clerkId -googleId') // Exclude confidential fields
          .lean();
      } else if (participantId.startsWith('P-')) {
        // Public participant with anonymous ID - need to find by matching generated ID
        const allParticipants = await Participant.find({})
          .select('-__v -clerkId -googleId')
          .sort({ createdAt: -1 })
          .lean();
        
        // Find participant by matching the generated anonymous ID
        participant = allParticipants.find(p => generateConsistentAnonymousId(p) === participantId);
      } else {
        // Legacy MongoDB ObjectId format
        try {
          participant = await Participant.findById(participantId)
            .select('-__v -clerkId -googleId') // Exclude confidential fields
            .lean();
        } catch (error) {
          return NextResponse.json(
            { success: false, error: 'Invalid participant ID format' },
            { status: 400 }
          );
        }
      }

      if (!participant) {
        return NextResponse.json(
          { success: false, error: 'Participant not found' },
          { status: 404 }
        );
      }

      // Format participant data without exposing confidential information
      const formattedParticipant = {
        id: generateConsistentAnonymousId(participant),
        name: participant.firstName + " " + participant.lastName,
        email: participant.email,
        age: participant.age,
        gender: participant.gender,
        education: participant.education,
        studyStatus: participant.studyStatus,
        userType: participant.userType,
        participantCode: participant.participantCode,
        testsCompleted: participant.testsCompleted || [],
        testResults: participant.testResults || [],
        registeredAt: participant.createdAt,
        lastLoginAt: participant.lastLoginAt,
        profileImageUrl: participant.profileImageUrl
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
    console.error('❌ Admin API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

function calculateStatistics(participants) {
  const totalParticipants = participants.length;
  
  let completedTests = 0;
  const testTypes = {};
  const genderBreakdown = {};
  const educationBreakdown = {};
  let totalAge = 0;
  let ageCount = 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let todaysTests = 0;

  participants.forEach(participant => {
    // Count completed tests
    if (participant.testResults && Array.isArray(participant.testResults)) {
      const testCount = participant.testResults.length;
      completedTests += testCount;

      participant.testResults.forEach(result => {
        const resultDate = new Date(result.completedAt || result.timestamp);
        if (resultDate >= today) {
          todaysTests++;
        }

        const testId = result.testId;
        testTypes[testId] = (testTypes[testId] || 0) + 1;
      });
    }

    // Demographics
    const gender = participant.gender || 'unknown';
    genderBreakdown[gender] = (genderBreakdown[gender] || 0) + 1;

    const education = participant.education || 'unknown';
    educationBreakdown[education] = (educationBreakdown[education] || 0) + 1;

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

function generateConsistentAnonymousId(participant) {
  if (participant.userType === 'research' && participant.participantCode) {
    return `R-${participant.participantCode}`;
  }
  
  // For public participants, create a consistent ID based on creation date and email hash
  const createdDate = new Date(participant.createdAt);
  const dateStr = createdDate.toISOString().substr(0, 10).replace(/-/g, '');
  const emailHash = participant.email ? participant.email.slice(-4).toUpperCase() : '0000';
  return `P-${dateStr.slice(-4)}${emailHash}`;
} 