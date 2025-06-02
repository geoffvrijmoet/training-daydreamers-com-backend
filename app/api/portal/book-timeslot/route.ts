import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CalendarTimeslotModel, { ICalendarTimeslot } from '@/models/CalendarTimeslot';
import { Types } from 'mongoose';

// POST /api/portal/book-timeslot
// Public endpoint for clients to book available timeslots
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const { timeslotId, clientId, clientName, dogName } = body;

    // Validation
    if (!timeslotId || !clientId || !clientName || !dogName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(timeslotId) || !Types.ObjectId.isValid(clientId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid timeslot or client ID' },
        { status: 400 }
      );
    }

    // Find the timeslot and verify it's available
    const timeslot = await CalendarTimeslotModel.findById(timeslotId);

    if (!timeslot) {
      return NextResponse.json(
        { success: false, error: 'Timeslot not found' },
        { status: 404 }
      );
    }

    if (!timeslot.isAvailable) {
      return NextResponse.json(
        { success: false, error: 'Timeslot is no longer available' },
        { status: 409 }
      );
    }

    // Check if the timeslot is already booked (race condition protection)
    if (timeslot.bookedByClientId) {
      return NextResponse.json(
        { success: false, error: 'Timeslot has already been booked' },
        { status: 409 }
      );
    }

    // Book the timeslot
    const updatedTimeslot = await CalendarTimeslotModel.findByIdAndUpdate(
      timeslotId,
      {
        isAvailable: false,
        bookedByClientId: new Types.ObjectId(clientId),
        // Note: sessionId and packageInstanceId can be set later by admin
      },
      { new: true, runValidators: true }
    );

    if (!updatedTimeslot) {
      return NextResponse.json(
        { success: false, error: 'Failed to book timeslot' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Timeslot booked successfully',
      booking: {
        timeslotId: updatedTimeslot._id.toString(),
        clientId,
        clientName,
        dogName,
        startTime: updatedTimeslot.startTime,
        endTime: updatedTimeslot.endTime,
      }
    });

  } catch (error) {
    console.error('Error booking timeslot:', error);
    
    // Handle duplicate key errors (if unique constraints exist)
    if (error instanceof Error && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Timeslot is already booked' },
        { status: 409 }
      );
    }
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 