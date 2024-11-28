import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { PushOperator } from 'mongodb';

interface KeyConcept {
  title: string;
  description: string;
}

export async function POST(request: Request) {
  try {
    const { title, description } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    const update = {
      $push: {
        keyConcepts: { title, description }
      }
    } as { $push: PushOperator<Document> };

    const result = await db.collection('settings').updateOne(
      { type: 'training_options' },
      update,
      { upsert: true }
    );

    if (!result.acknowledged) {
      throw new Error('Failed to add concept');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding key concept:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add key concept' },
      { status: 500 }
    );
  }
} 