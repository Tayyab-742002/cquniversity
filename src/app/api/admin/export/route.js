import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';

export async function GET() {
  try {
    // Check authentication (admin access)
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    const participants = await Participant.find({}).lean();
    
    // Create comprehensive export data
    const exportData = participants.map(participant => {
      const testResults = participant.testResults || [];
      
      // Base participant data
      const baseData = {
        participantId: participant._id.toString(),
        clerkId: participant.clerkId,
        firstName: participant.firstName,
        lastName: participant.lastName,
        fullName: `${participant.firstName} ${participant.lastName}`,
        email: participant.email,
        age: participant.age,
        gender: participant.gender,
        education: participant.education,
        studyStatus: participant.studyStatus,
        authMethod: 'Google (Clerk)',
        registeredAt: participant.createdAt,
        lastLoginAt: participant.lastLoginAt,
        testsCompleted: participant.testsCompleted?.length || 0
      };
      
      // If no test results, return base data with empty test fields
      if (testResults.length === 0) {
        return {
          ...baseData,
          testId: '',
          testCompletedAt: '',
          testMetrics: '',
          testRawData: ''
        };
      }
      
      // Create one row per test result
      return testResults.map(result => ({
        ...baseData,
        testId: result.testId,
        testCompletedAt: result.completedAt,
        testMetrics: JSON.stringify(result.metrics || {}),
        testRawData: JSON.stringify(result.rawData || {})
      }));
    }).flat();
    
    // Define CSV headers
    const headers = [
      'participantId',
      'clerkId', 
      'firstName',
      'lastName',
      'fullName',
      'email',
      'age',
      'gender',
      'education',
      'studyStatus',
      'authMethod',
      'registeredAt',
      'lastLoginAt',
      'testsCompleted',
      'testId',
      'testCompletedAt',
      'testMetrics',
      'testRawData'
    ];
    
    // Convert to CSV
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes in CSV values
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');
    
    // Set response headers for file download
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="psycotest-export-${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-cache'
      }
    });
    
    return response;
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
} 