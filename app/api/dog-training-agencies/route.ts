import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import DogTrainingAgency from '@/lib/models/DogTrainingAgency';

// GET - List all dog training agencies
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const agencies = await DogTrainingAgency.find({ isActive: true })
      .sort({ name: 1 })
      .lean();
    
    return NextResponse.json(agencies);
  } catch (error) {
    console.error('Error fetching dog training agencies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agencies' },
      { status: 500 }
    );
  }
}

// POST - Create new dog training agency
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Agency name is required' },
        { status: 400 }
      );
    }

    // Check if agency with same name already exists
    const existingAgency = await DogTrainingAgency.findOne({ 
      name: { $regex: new RegExp(`^${body.name}$`, 'i') },
      isActive: true 
    });
    
    if (existingAgency) {
      return NextResponse.json(
        { error: 'Agency with this name already exists' },
        { status: 400 }
      );
    }

    const agency = new DogTrainingAgency({
      name: body.name,
      contactName: body.contactName,
      email: body.email,
      phone: body.phone,
      address: body.address,
      website: body.website,
      revenueSharePercentage: Number(body.revenueSharePercentage) || 0,
      handlesSalesTax: Boolean(body.handlesSalesTax),
      notes: body.notes,
      isActive: true
    });

    await agency.save();
    
    return NextResponse.json(agency, { status: 201 });
  } catch (error) {
    console.error('Error creating dog training agency:', error);
    return NextResponse.json(
      { error: 'Failed to create agency' },
      { status: 500 }
    );
  }
} 