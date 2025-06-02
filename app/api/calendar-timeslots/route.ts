import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server'; // Use server-side auth
import { connectDB } from '@/lib/db';
import CalendarTimeslotModel, { ICalendarTimeslot } from '@/models/CalendarTimeslot'; // Use different name for default import
import { Types } from 'mongoose'; // Import Types
import { toZonedTime, fromZonedTime } from 'date-fns-tz'; // Add date-fns-tz for timezone conversion

const TIME_ZONE = "America/New_York"; // Define timezone constant

// GET /api/calendar-timeslots
// Fetches timeslots within a given date range
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startStr = searchParams.get('start');
  const endStr = searchParams.get('end');

  if (!startStr || !endStr) {
    return NextResponse.json({ success: false, error: 'Missing start or end query parameters' }, { status: 400 });
  }

  try {
    await connectDB();

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
       return NextResponse.json({ success: false, error: 'Invalid date format' }, { status: 400 });
    }

    const timeslots = await CalendarTimeslotModel.find({
      startTime: { $gte: startDate },
      endTime: { $lte: endDate },
      // Add other filters if needed, e.g., only Madeline's slots if multi-trainer later
    }).lean<ICalendarTimeslot[]>();

    // Format for FullCalendar
    const formattedEvents = timeslots.map(slot => {
      // Explicitly handle potential ObjectId or string for _id after lean
      const idString = typeof slot._id === 'string' ? slot._id : (slot._id as Types.ObjectId)?.toString();
      
      // Convert UTC times to Eastern timezone for display
      const startTimeInEastern = toZonedTime(slot.startTime, TIME_ZONE);
      const endTimeInEastern = toZonedTime(slot.endTime, TIME_ZONE);
      
      // Format as YYYY-MM-DDTHH:mm:ss for FullCalendar (without timezone offset)
      const formatForFullCalendar = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };
      
      return {
        id: idString ?? new Types.ObjectId().toString(), // Fallback ID if conversion fails?
        title: slot.isAvailable ? 'Available' : 'Booked',
        // Use the formatted Eastern timezone times
        start: formatForFullCalendar(startTimeInEastern),
        end: formatForFullCalendar(endTimeInEastern),
        color: slot.isAvailable ? '#a3e6ff' : '#fecaca',
        extendedProps: { 
          isAvailable: slot.isAvailable,
          notes: slot.notes,
          // Check type before toString for optional refs
          sessionId: slot.sessionId instanceof Types.ObjectId ? slot.sessionId.toString() : slot.sessionId,
          clientId: slot.bookedByClientId instanceof Types.ObjectId ? slot.bookedByClientId.toString() : slot.bookedByClientId,
          packageInstanceId: slot.packageInstanceId instanceof Types.ObjectId ? slot.packageInstanceId.toString() : slot.packageInstanceId,
          repeatingSeriesId: slot.repeatingSeriesId,
        },
      };
    });

    return NextResponse.json({ success: true, events: formattedEvents });

  } catch (error) {
    console.error("Error fetching timeslots:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// POST /api/calendar-timeslots
// Creates a new timeslot (or potentially repeating ones)
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await request.json();

    // Basic validation (improve as needed)
    if (!body.startTime || !body.endTime) {
      return NextResponse.json({ success: false, error: 'Missing startTime or endTime' }, { status: 400 });
    }
    
    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime()) || endTime <= startTime) {
       return NextResponse.json({ success: false, error: 'Invalid start/end time' }, { status: 400 });
    }

    // TODO: Implement Overlap Check / Merge Logic here before creating
    // TODO: Implement Repeating Slot Logic here

    const newTimeslotData = {
        startTime,
        endTime,
        isAvailable: true,
        notes: body.notes,
        repeatingSeriesId: body.repeatingSeriesId, // Pass from body if applicable
    };

    const newTimeslot = new CalendarTimeslotModel(newTimeslotData);
    await newTimeslot.save();

    // Format the response similarly to GET for consistency if needed by frontend
    const savedSlot = newTimeslot.toObject();
    const responseSlot = {
        id: savedSlot._id.toString(),
        start: savedSlot.startTime.toISOString(), // Add fields needed by FullCalendar
        end: savedSlot.endTime.toISOString(),
        title: savedSlot.isAvailable ? 'Available' : 'Booked',
        color: savedSlot.isAvailable ? '#a3e6ff' : '#fecaca',
        extendedProps: { 
          isAvailable: savedSlot.isAvailable,
          notes: savedSlot.notes,
          sessionId: savedSlot.sessionId?.toString(),
          clientId: savedSlot.bookedByClientId?.toString(),
          packageInstanceId: savedSlot.packageInstanceId?.toString(),
          repeatingSeriesId: savedSlot.repeatingSeriesId,
        },
    };
    // Remove original _id, startTime, endTime if not needed alongside formatted ones

    return NextResponse.json({ 
        success: true, 
        timeslot: responseSlot
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating timeslot:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
     // Handle potential duplicate key errors if unique indexes are used
    if (error instanceof Error && 'code' in error && error.code === 11000) {
         return NextResponse.json({ success: false, error: 'Timeslot conflict detected.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// TODO: Implement PUT /api/calendar-timeslots/[id]
// TODO: Implement DELETE /api/calendar-timeslots/[id] 