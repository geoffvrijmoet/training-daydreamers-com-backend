import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CalendarTimeslotModel, { ICalendarTimeslot } from '@/models/CalendarTimeslot';
import { Types } from 'mongoose';
import { toZonedTime } from 'date-fns-tz';

const TIME_ZONE = "America/New_York";

// GET /api/portal/calendar-timeslots
// Public endpoint for clients to fetch available timeslots and their own booked timeslots
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startStr = searchParams.get('start');
  const endStr = searchParams.get('end');
  const clientId = searchParams.get('clientId'); // Optional clientId to include their booked slots

  if (!startStr || !endStr) {
    return NextResponse.json(
      { success: false, error: 'Missing start or end query parameters' },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    let query: {
      startTime: { $gte: Date };
      endTime: { $lte: Date };
      isAvailable?: boolean;
      $or?: Array<{ isAvailable: boolean; bookedByClientId?: Types.ObjectId }>;
    } = {
      startTime: { $gte: startDate },
      endTime: { $lte: endDate },
    };

    // If clientId is provided, fetch available slots + this client's booked slots
    if (clientId && Types.ObjectId.isValid(clientId)) {
      query = {
        ...query,
        $or: [
          { isAvailable: true }, // Available slots
          { isAvailable: false, bookedByClientId: new Types.ObjectId(clientId) } // This client's booked slots
        ]
      };
    } else {
      // Default behavior: only available slots
      query.isAvailable = true;
    }

    const timeslots = await CalendarTimeslotModel.find(query).lean<ICalendarTimeslot[]>();

    // Format for the client calendar
    const formattedEvents = timeslots.map(slot => {
      const idString = typeof slot._id === 'string' ? slot._id : (slot._id as Types.ObjectId)?.toString();
      
      // Convert UTC times to Eastern timezone for display
      const startTimeInEastern = toZonedTime(slot.startTime, TIME_ZONE);
      const endTimeInEastern = toZonedTime(slot.endTime, TIME_ZONE);
      
      // Format as YYYY-MM-DDTHH:mm:ss for consistent parsing
      const formatForClient = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };
      
      // Determine if this is the client's own booking
      const isOwnBooking = !slot.isAvailable && 
                          clientId && 
                          slot.bookedByClientId && 
                          slot.bookedByClientId.toString() === clientId;
      
      return {
        id: idString ?? new Types.ObjectId().toString(),
        title: slot.isAvailable ? 'Available' : (isOwnBooking ? 'Your Booking' : 'Booked'),
        start: formatForClient(startTimeInEastern),
        end: formatForClient(endTimeInEastern),
        color: slot.isAvailable ? '#a3e6ff' : (isOwnBooking ? '#93c5fd' : '#d1d5db'), // Light blue for available, blue for own booking, gray for others
        extendedProps: { 
          isAvailable: slot.isAvailable,
          isOwnBooking: isOwnBooking,
          notes: slot.notes,
          repeatingSeriesId: slot.repeatingSeriesId,
          clientId: slot.bookedByClientId?.toString(),
          sessionId: slot.sessionId?.toString(),
        },
      };
    });

    return NextResponse.json({ success: true, events: formattedEvents });

  } catch (error) {
    console.error("Error fetching public timeslots:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 