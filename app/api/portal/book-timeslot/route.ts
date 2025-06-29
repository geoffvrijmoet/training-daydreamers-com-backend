import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CalendarTimeslotModel, { ICalendarTimeslot } from '@/models/CalendarTimeslot';
import { Types } from 'mongoose';
import { startOfHour, addHours, isBefore, isAfter } from 'date-fns';

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

    // ---------------------------------------------------------------------
    // New Splitting Logic — assume the actual session booked is exactly
    // one hour within the selected (potentially longer) timeslot.
    // The client can send an optional `selectedStartTime` (ISO string)
    // representing the start of the desired one-hour window. If omitted,
    // we assume the booking starts at the original timeslot.startTime.
    // ---------------------------------------------------------------------

    const { selectedStartTime } = body as { selectedStartTime?: string };

    const originalStart = timeslot.startTime;
    const originalEnd = timeslot.endTime;

    // Determine the sub-slot start: round down to the exact hour boundary to
    // avoid minute-level bookings.
    let subStart = selectedStartTime ? new Date(selectedStartTime) : originalStart;
    subStart = startOfHour(subStart);

    const subEnd = addHours(subStart, 1);

    // Validate that sub-slot sits entirely within the originally selected
    // timeslot boundaries.
    if (isBefore(subStart, originalStart) || isAfter(subEnd, originalEnd)) {
      return NextResponse.json(
        { success: false, error: 'Selected time is outside the available range.' },
        { status: 400 }
      );
    }

    // Transaction to keep everything consistent.
    const session = await CalendarTimeslotModel.startSession();
    session.startTransaction();

    try {
      // 1. Update the original document so that it now represents the booked
      //    one-hour window and is marked unavailable.
      const bookedSlot = await CalendarTimeslotModel.findOneAndUpdate(
        { _id: timeslot._id, isAvailable: true }, // Ensure still available
        {
          startTime: subStart,
          endTime: subEnd,
          isAvailable: false,
          bookedByClientId: new Types.ObjectId(clientId),
        },
        { new: true, runValidators: true, session }
      );

      if (!bookedSlot) {
        // Likely race-condition — someone booked it before us.
        await session.abortTransaction();
        return NextResponse.json(
          { success: false, error: 'Timeslot has already been booked' },
          { status: 409 }
        );
      }

      const siblingSlots: ICalendarTimeslot[] = [];

      // 2. Generate preceding one-hour slots (if any)
      let pointer = new Date(originalStart);
      while (isBefore(pointer, subStart)) {
        const nextEnd = addHours(pointer, 1);
        const newSlot = new CalendarTimeslotModel({
          startTime: pointer,
          endTime: nextEnd,
          isAvailable: true,
          notes: timeslot.notes,
          repeatingSeriesId: timeslot.repeatingSeriesId,
        });
        siblingSlots.push(newSlot);
        pointer = nextEnd;
      }

      // 3. Generate following one-hour slots (if any)
      pointer = subEnd;
      while (isBefore(pointer, originalEnd)) {
        const nextEnd = addHours(pointer, 1);
        const cappedEnd = nextEnd > originalEnd ? originalEnd : nextEnd;
        const newSlot = new CalendarTimeslotModel({
          startTime: pointer,
          endTime: cappedEnd,
          isAvailable: true,
          notes: timeslot.notes,
          repeatingSeriesId: timeslot.repeatingSeriesId,
        });
        siblingSlots.push(newSlot);
        pointer = cappedEnd;
      }

      if (siblingSlots.length) {
        await CalendarTimeslotModel.insertMany(siblingSlots, { session });
      }

      await session.commitTransaction();

      return NextResponse.json({
        success: true,
        message: 'Session booked successfully',
        booking: {
          timeslotId: bookedSlot._id.toString(),
          clientId,
          clientName,
          dogName,
          startTime: bookedSlot.startTime,
          endTime: bookedSlot.endTime,
        },
      });

    } catch (err) {
      await session.abortTransaction();
      throw err; // Let outer catch handle
    } finally {
      session.endSession();
    }

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