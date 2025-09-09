import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CalendarTimeslotModel, { ICalendarTimeslot } from '@/models/CalendarTimeslot';
import { Types } from 'mongoose';
import { addHours } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { getSystemGoogleCalendarEvents } from '@/lib/google-calendar';

// POST /api/portal/book-timeslot
// Public endpoint for clients to book available timeslots
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const { selectedStartTime, clientId, clientName, dogName } = body;

    // Validation
    if (!selectedStartTime || !clientId || !clientName || !dogName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(clientId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    // Parse the selected start time
    const selectedStart = new Date(selectedStartTime);
    if (isNaN(selectedStart.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid start time format' },
        { status: 400 }
      );
    }

    // Convert to UTC for storage
    const TIME_ZONE = "America/New_York";
    const selectedStartUTC = fromZonedTime(selectedStart, TIME_ZONE);
    const selectedEndUTC = addHours(selectedStartUTC, 1);

    // Check if this time slot is still available
    // 1. Check for existing bookings
    const existingBooking = await CalendarTimeslotModel.findOne({
      startTime: { $lt: selectedEndUTC },
      endTime: { $gt: selectedStartUTC },
      isAvailable: false
    });

    if (existingBooking) {
      return NextResponse.json(
        { success: false, error: 'This time slot has already been booked' },
        { status: 409 }
      );
    }

    // 2. Check against Google Calendar events
    try {
      const googleEvents = await getSystemGoogleCalendarEvents(selectedStartUTC, selectedEndUTC);
      const hasGoogleConflict = googleEvents.some(event => {
        return (event.start < selectedEndUTC && event.end > selectedStartUTC);
      });

      if (hasGoogleConflict) {
        return NextResponse.json(
          { success: false, error: 'This time slot is no longer available' },
          { status: 409 }
        );
      }
    } catch (error) {
      console.error('Error checking Google Calendar conflicts:', error);
      // Continue with booking if we can't check Google Calendar
    }

    // Create a new timeslot for this booking
    const newBooking = new CalendarTimeslotModel({
      startTime: selectedStartUTC,
      endTime: selectedEndUTC,
      isAvailable: false,
      bookedByClientId: new Types.ObjectId(clientId),
      notes: `Session with ${clientName} (${dogName})`,
    });

    await newBooking.save();

    console.log(`✅ New booking created: ${clientName} (${dogName}) for ${selectedStartUTC.toISOString()} - ${selectedEndUTC.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: 'Session booked successfully',
      booking: {
        id: newBooking._id,
        startTime: newBooking.startTime,
        endTime: newBooking.endTime,
        clientId: newBooking.bookedByClientId,
        clientName,
        dogName,
      },
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