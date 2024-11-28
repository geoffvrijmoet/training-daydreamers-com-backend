import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import type { PullOperator } from 'mongodb';

interface KeyConcept {
  title: string;
  description: string;
}

export async function GET(
  request: Request,
  { params }: { params: { title: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    const settings = await db.collection('settings').findOne(
      { type: 'training_options' }
    );
    
    const concept = settings?.keyConcepts?.find(
      (c: KeyConcept) => c.title === decodeURIComponent(params.title)
    );
    
    if (!concept) {
      return NextResponse.json(
        { success: false, error: 'Concept not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, concept });
  } catch (error) {
    console.error('Error fetching key concept:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch key concept' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { title: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    const update = {
      $pull: {
        keyConcepts: { title: decodeURIComponent(params.title) }
      }
    } as { $pull: PullOperator<Document> };

    const result = await db.collection('settings').updateOne(
      { type: 'training_options' },
      update
    );

    if (!result.acknowledged) {
      throw new Error('Failed to delete concept');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting key concept:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete key concept' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { title: string } }
) {
  try {
    const { title, description } = await request.json();
    const oldTitle = decodeURIComponent(params.title);

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    const result = await db.collection('settings').updateOne(
      { 
        type: 'training_options',
        'keyConcepts.title': oldTitle 
      },
      { 
        $set: {
          'keyConcepts.$': { title, description }
        }
      }
    );

    if (!result.acknowledged) {
      throw new Error('Failed to update concept');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating key concept:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update key concept' },
      { status: 500 }
    );
  }
} 