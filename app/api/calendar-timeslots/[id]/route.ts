import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import CalendarTimeslotModel from '@/models/CalendarTimeslot';
import { Types } from 'mongoose';

// DELETE /api/calendar-timeslots/[id]
// Deletes a single timeslot or entire recurring series
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const deleteAll = searchParams.get('deleteAll') === 'true';
  const timeslotId = params.id;

  if (!Types.ObjectId.isValid(timeslotId)) {
    return NextResponse.json({ success: false, error: 'Invalid timeslot ID' }, { status: 400 });
  }

  try {
    await connectDB();

    // First, find the timeslot to get its repeatingSeriesId
    const timeslot = await CalendarTimeslotModel.findById(timeslotId);
    
    if (!timeslot) {
      return NextResponse.json({ success: false, error: 'Timeslot not found' }, { status: 404 });
    }

    let deletedCount = 0;

    if (deleteAll && timeslot.repeatingSeriesId) {
      // Delete all timeslots in the series
      const result = await CalendarTimeslotModel.deleteMany({
        repeatingSeriesId: timeslot.repeatingSeriesId
      });
      deletedCount = result.deletedCount || 0;
    } else {
      // Delete only this specific timeslot
      const result = await CalendarTimeslotModel.deleteOne({ _id: timeslotId });
      deletedCount = result.deletedCount || 0;
    }

    if (deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'No timeslots were deleted' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: deleteAll && timeslot.repeatingSeriesId 
        ? `Deleted ${deletedCount} timeslots from the recurring series`
        : 'Timeslot deleted successfully',
      deletedCount
    });

  } catch (error) {
    console.error('Error deleting timeslot:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 