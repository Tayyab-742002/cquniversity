import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';
import { withAdminAuth } from '@/lib/adminAuth';

function escapeCSV(field) {
  if (field === null || field === undefined) return '';
  
  const str = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function flattenTestResults(participant) {
  const baseData = {
    participantId: participant._id.toString(),
    name: participant.name,
    email: participant.email,
    age: participant.age,
    gender: participant.gender,
    educationLevel: participant.educationLevel,
    ipAddress: participant.ipAddress || '',
    registeredAt: participant.registeredAt ? new Date(participant.registeredAt).toISOString() : ''
  };

  if (!participant.testResults || participant.testResults.length === 0) {
    return [{
      ...baseData,
      testId: '',
      completedAt: '',
      // Add empty columns for all possible metrics
      accuracy: '',
      totalTrials: '',
      correctTrials: '',
      averageRT: '',
      congruentRT: '',
      incongruentRT: '',
      stroopEffect: '',
      forwardSpan: '',
      backwardSpan: '',
      totalSpan: '',
      forwardAccuracy: '',
      backwardAccuracy: '',
      sampleATime: '',
      sampleAErrors: '',
      trialATime: '',
      trialAErrors: '',
      sampleBTime: '',
      sampleBErrors: '',
      trialBTime: '',
      trialBErrors: '',
      bMinusA: '',
      newDesigns: '',
      repetitions: '',
      mistakes: '',
      totalDesigns: ''
    }];
  }

  return participant.testResults.map(result => {
    const metrics = result.metrics || {};
    
    return {
      ...baseData,
      testId: result.testId || '',
      completedAt: result.completedAt ? new Date(result.completedAt).toISOString() : '',
      
      // Stroop Test metrics
      accuracy: metrics.accuracy || '',
      totalTrials: metrics.totalTrials || '',
      correctTrials: metrics.correctTrials || '',
      averageRT: metrics.averageRT || '',
      congruentRT: metrics.congruentRT || '',
      incongruentRT: metrics.incongruentRT || '',
      stroopEffect: metrics.stroopEffect || '',
      
      // Corsi Blocks metrics
      forwardSpan: metrics.forwardSpan || '',
      backwardSpan: metrics.backwardSpan || '',
      totalSpan: metrics.totalSpan || '',
      forwardAccuracy: metrics.forwardAccuracy || '',
      backwardAccuracy: metrics.backwardAccuracy || '',
      
      // Trail Making metrics (using rawData for detailed results)
      sampleATime: result.rawData?.sampleA?.time || '',
      sampleAErrors: result.rawData?.sampleA?.errors || '',
      trialATime: result.rawData?.trialA?.time || '',
      trialAErrors: result.rawData?.trialA?.errors || '',
      sampleBTime: result.rawData?.sampleB?.time || '',
      sampleBErrors: result.rawData?.sampleB?.errors || '',
      trialBTime: result.rawData?.trialB?.time || '',
      trialBErrors: result.rawData?.trialB?.errors || '',
      bMinusA: result.rawData?.bMinusA || '',
      
      // Five Point Test metrics
      newDesigns: metrics.newDesigns || '',
      repetitions: metrics.repetitions || '',
      mistakes: metrics.mistakes || '',
      totalDesigns: metrics.totalDesigns || ''
    };
  });
}

async function exportData() {
  try {
    await connectToDatabase();
    
    // Get all participants with their test results
    const participants = await Participant.find({}).lean();
    
    // Flatten data for CSV
    const flatData = [];
    participants.forEach(participant => {
      const rows = flattenTestResults(participant);
      flatData.push(...rows);
    });
    
    // Define CSV headers
    const headers = [
      'participantId',
      'name',
      'email',
      'age',
      'gender',
      'educationLevel',
      'ipAddress',
      'registeredAt',
      'testId',
      'completedAt',
      // Stroop Test columns
      'accuracy',
      'totalTrials',
      'correctTrials',
      'averageRT',
      'congruentRT',
      'incongruentRT',
      'stroopEffect',
      // Corsi Blocks columns
      'forwardSpan',
      'backwardSpan',
      'totalSpan',
      'forwardAccuracy',
      'backwardAccuracy',
      // Trail Making columns
      'sampleATime',
      'sampleAErrors',
      'trialATime',
      'trialAErrors',
      'sampleBTime',
      'sampleBErrors',
      'trialBTime',
      'trialBErrors',
      'bMinusA',
      // Five Point Test columns
      'newDesigns',
      'repetitions',
      'mistakes',
      'totalDesigns'
    ];
    
    // Generate CSV content
    let csvContent = headers.join(',') + '\n';
    
    flatData.forEach(row => {
      const csvRow = headers.map(header => escapeCSV(row[header])).join(',');
      csvContent += csvRow + '\n';
    });
    
    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="psycotest_data_${new Date().toISOString().split('T')[0]}.csv"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(exportData); 