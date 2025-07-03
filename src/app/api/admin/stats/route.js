import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';
import { withAdminAuth } from '@/lib/adminAuth';

async function getStats() {
  try {
    await connectToDatabase();
    
    // Get all participants
    const participants = await Participant.find({}).lean();
    
    // Calculate statistics
    const totalParticipants = participants.length;
    
    // Count completed tests
    let completedTests = 0;
    participants.forEach(participant => {
      if (participant.testResults) {
        completedTests += participant.testResults.length;
      }
    });
    
    // Calculate average age
    const ages = participants.map(p => p.age).filter(age => age && !isNaN(age));
    const averageAge = ages.length > 0 ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0;
    
    // Count today's tests
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let todaysTests = 0;
    participants.forEach(participant => {
      if (participant.testResults) {
        participant.testResults.forEach(result => {
          const completedAt = new Date(result.completedAt);
          if (completedAt >= today && completedAt < tomorrow) {
            todaysTests++;
          }
        });
      }
    });
    
    // Test type breakdown
    const testTypes = {
      stroopTest: 0,
      trailMakingTest: 0,
      corsiBlocksTest: 0,
      fivePointsTest: 0
    };
    
    participants.forEach(participant => {
      if (participant.testResults) {
        participant.testResults.forEach(result => {
          if (testTypes.hasOwnProperty(result.testId)) {
            testTypes[result.testId]++;
          }
        });
      }
    });
    
    // Gender breakdown
    const genderBreakdown = {
      male: 0,
      female: 0,
      other: 0,
      'prefer-not-to-say': 0
    };
    
    participants.forEach(participant => {
      if (genderBreakdown.hasOwnProperty(participant.gender)) {
        genderBreakdown[participant.gender]++;
      }
    });
    
    // Education breakdown
    const educationBreakdown = {
      'high-school': 0,
      'bachelors': 0,
      'masters': 0,
      'doctorate': 0,
      'other': 0
    };
    
    participants.forEach(participant => {
      if (educationBreakdown.hasOwnProperty(participant.educationLevel)) {
        educationBreakdown[participant.educationLevel]++;
      }
    });
    
    return NextResponse.json({
      totalParticipants,
      completedTests,
      averageAge,
      todaysTests,
      testTypes,
      genderBreakdown,
      educationBreakdown,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating stats:', error);
    return NextResponse.json(
      { error: 'Failed to calculate statistics' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(getStats); 