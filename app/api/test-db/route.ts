import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await connectDB();
    
    // Test basic database operations
    const collections = await mongoose.connection.db?.listCollections().toArray();
    
    return NextResponse.json({ 
      success: true, 
      message: 'MongoDB connection successful',
      databaseName: mongoose.connection.db?.databaseName,
      collections: collections?.map(c => c.name) || [],
      connectionState: mongoose.connection.readyState
    });
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      connectionState: mongoose.connection.readyState
    }, { status: 500 });
  }
} 