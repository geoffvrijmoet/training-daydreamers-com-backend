import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import DogTrainingAgency from '@/lib/models/DogTrainingAgency';
import mongoose from 'mongoose';

// GET - Fetch single dog training agency
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid agency ID' }, { status: 400 });
    }
    
    const agency = await DogTrainingAgency.findById(params.id).lean();
    
    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }
    
    return NextResponse.json(agency);
  } catch (error) {
    console.error('Error fetching dog training agency:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agency' },
      { status: 500 }
    );
  }
}

// PUT - Update dog training agency
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid agency ID' }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Agency name is required' },
        { status: 400 }
      );
    }

    // Check if another agency with same name exists (excluding current agency)
    const existingAgency = await DogTrainingAgency.findOne({ 
      name: { $regex: new RegExp(`^${body.name}$`, 'i') },
      isActive: true,
      _id: { $ne: params.id }
    });
    
    if (existingAgency) {
      return NextResponse.json(
        { error: 'Another agency with this name already exists' },
        { status: 400 }
      );
    }

    const updatedAgency = await DogTrainingAgency.findByIdAndUpdate(
      params.id,
      {
        name: body.name,
        contactName: body.contactName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        website: body.website,
        revenueSharePercentage: Number(body.revenueSharePercentage) || 0,
        handlesSalesTax: Boolean(body.handlesSalesTax),
        notes: body.notes,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true
      },
      { new: true, runValidators: true }
    );

    if (!updatedAgency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedAgency);
  } catch (error) {
    console.error('Error updating dog training agency:', error);
    return NextResponse.json(
      { error: 'Failed to update agency' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete dog training agency (set isActive to false)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid agency ID' }, { status: 400 });
    }
    
    const updatedAgency = await DogTrainingAgency.findByIdAndUpdate(
      params.id,
      { isActive: false },
      { new: true }
    );

    if (!updatedAgency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Agency deactivated successfully' });
  } catch (error) {
    console.error('Error deleting dog training agency:', error);
    return NextResponse.json(
      { error: 'Failed to delete agency' },
      { status: 500 }
    );
  }
} 