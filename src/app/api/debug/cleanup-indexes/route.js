import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Participant from '@/models/Participant';

/**
 * API endpoint to clean up old MongoDB indexes (specifically deviceId)
 * This removes outdated indexes that are causing duplicate key errors
 */
export async function DELETE(request) {
  try {
    console.log('🧹 Starting index cleanup...');
    
    // Connect to database
    await connectToDatabase();
    
    // Get the collection
    const collection = Participant.collection;
    
    // List all indexes first to see what exists
    const indexes = await collection.listIndexes().toArray();
    console.log('📋 Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    // Check if deviceId index exists
    const deviceIdIndex = indexes.find(idx => idx.key && idx.key.deviceId);
    
    if (deviceIdIndex) {
      console.log('🗑️ Found deviceId index, removing:', deviceIdIndex.name);
      
      // Drop the deviceId index
      await collection.dropIndex(deviceIdIndex.name);
      
      console.log('✅ Successfully removed deviceId index');
      
      return NextResponse.json({
        success: true,
        message: 'Successfully removed deviceId index',
        removedIndex: deviceIdIndex.name
      });
    } else {
      console.log('ℹ️ No deviceId index found');
      
      return NextResponse.json({
        success: true,
        message: 'No deviceId index found - cleanup not needed',
        currentIndexes: indexes.map(idx => ({ name: idx.name, key: idx.key }))
      });
    }
    
  } catch (error) {
    console.error('❌ Index cleanup error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to clean up indexes',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * GET endpoint to list all current indexes
 */
export async function GET(request) {
  try {
    console.log('📋 Listing current indexes...');
    
    // Connect to database
    await connectToDatabase();
    
    // Get the collection
    const collection = Participant.collection;
    
    // List all indexes
    const indexes = await collection.listIndexes().toArray();
    
    console.log('📋 Current indexes:', indexes);
    
    return NextResponse.json({
      success: true,
      indexes: indexes.map(idx => ({
        name: idx.name,
        key: idx.key,
        unique: idx.unique || false,
        sparse: idx.sparse || false
      }))
    });
    
  } catch (error) {
    console.error('❌ Error listing indexes:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to list indexes',
      details: error.message
    }, { status: 500 });
  }
} 