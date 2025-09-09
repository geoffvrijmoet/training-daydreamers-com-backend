import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CalendarTimeslotModel, { ICalendarTimeslot } from '@/models/CalendarTimeslot';
import { startOfDay, endOfDay, addHours, isWithinInterval, eachHourOfInterval } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { getSystemGoogleCalendarEvents } from '@/lib/google-calendar';

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

    // NEW SYSTEM: Generate availability based on Google Calendar events
    // 1. Get all existing bookings from calendar_timeslots
    const existingBookings = await CalendarTimeslotModel.find({
      startTime: { $gte: startDate },
      endTime: { $lte: endDate },
      isAvailable: false // Only get booked slots
    }).lean<ICalendarTimeslot[]>();

    // 2. Get Google Calendar events (Madeline's unavailable times)
    let googleCalendarEvents: Array<{ start: Date; end: Date; id: string }> = [];
    try {
      const rawSystemEvents = await getSystemGoogleCalendarEvents(startDate, endDate);
      googleCalendarEvents = rawSystemEvents;
      // eslint-disable-next-line no-console
      console.log(`📅 Fetched ${googleCalendarEvents.length} Google Calendar events for availability calculation`);
    } catch (error) {
      console.error('Failed to fetch Google Calendar events for availability calculation:', error);
      // Continue without Google events - show all times as available
    }

    // 3. Generate all possible hourly slots for the date range
    const allPossibleSlots: Array<{
      start: Date;
      end: Date;
      isAvailable: boolean;
      isOwnBooking: boolean;
      bookingId?: string;
      source: 'available' | 'google-blocked' | 'booked' | 'own-booking';
    }> = [];

    // Convert dates to Eastern timezone for processing
    const startEastern = toZonedTime(startDate, TIME_ZONE);
    const endEastern = toZonedTime(endDate, TIME_ZONE);
    
    // Generate hourly slots from 9 AM to 6 PM Eastern (business hours)
    const businessStart = startOfDay(startEastern);
    businessStart.setHours(9, 0, 0, 0); // 9 AM Eastern
    const businessEnd = endOfDay(endEastern);
    businessEnd.setHours(18, 0, 0, 0); // 6 PM Eastern

    const hourlySlots = eachHourOfInterval({
      start: businessStart,
      end: businessEnd
    });

    // 4. For each hour, determine availability
    for (const hourStart of hourlySlots) {
      const hourEnd = addHours(hourStart, 1);
      
      // Skip if outside our requested date range
      if (hourStart < startEastern || hourEnd > endEastern) continue;
      
      // Convert back to UTC for comparison with stored data
      const hourStartUTC = fromZonedTime(hourStart, TIME_ZONE);
      const hourEndUTC = fromZonedTime(hourEnd, TIME_ZONE);

      // Check if this hour conflicts with Google Calendar events
      const isGoogleBlocked = googleCalendarEvents.some(event => {
        return isWithinInterval(hourStartUTC, { start: event.start, end: event.end }) ||
               isWithinInterval(hourEndUTC, { start: event.start, end: event.end }) ||
               (event.start <= hourStartUTC && event.end >= hourEndUTC);
      });

      // Check if this hour is already booked
      const existingBooking = existingBookings.find(booking => {
        return isWithinInterval(hourStartUTC, { start: booking.startTime, end: booking.endTime }) ||
               isWithinInterval(hourEndUTC, { start: booking.startTime, end: booking.endTime }) ||
               (booking.startTime <= hourStartUTC && booking.endTime >= hourEndUTC);
      });

      // Determine if this is the client's own booking
      const isOwnBooking = Boolean(existingBooking && 
                          clientId && 
                          existingBooking.bookedByClientId && 
                          existingBooking.bookedByClientId.toString() === clientId);

      // Determine availability and source
      let isAvailable = false;
      let source: 'available' | 'google-blocked' | 'booked' | 'own-booking' = 'available';
      
      if (isGoogleBlocked) {
        isAvailable = false;
        source = 'google-blocked';
      } else if (existingBooking) {
        isAvailable = false;
        source = isOwnBooking ? 'own-booking' : 'booked';
      } else {
        isAvailable = true;
        source = 'available';
      }

      allPossibleSlots.push({
        start: hourStartUTC,
        end: hourEndUTC,
        isAvailable,
        isOwnBooking,
        bookingId: existingBooking?._id?.toString(),
        source
      });
    }

    // 5. Format events for the client calendar
    const formatForClient = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const formattedEvents = allPossibleSlots.map(slot => {
      let title: string;
      let color: string;
      
      switch (slot.source) {
        case 'available':
          title = 'Available';
          color = '#10b981'; // Green - clearly available
          break;
        case 'own-booking':
          title = 'Your Booking';
          color = '#3b82f6'; // Blue - your session
          break;
        case 'booked':
          title = 'Booked';
          color = '#ef4444'; // Red - clearly unavailable
          break;
        case 'google-blocked':
          title = 'Unavailable';
          color = '#f59e0b'; // Amber/Orange - clearly unavailable
          break;
        default:
          title = 'Unknown';
          color = '#6b7280'; // Gray
      }

      return {
        id: slot.bookingId || `available-${slot.start.getTime()}`,
        title,
        start: formatForClient(slot.start),
        end: formatForClient(slot.end),
        color,
        extendedProps: {
          isAvailable: slot.isAvailable,
          isOwnBooking: slot.isOwnBooking,
          source: slot.source,
          bookingId: slot.bookingId,
        },
      };
    });

    // eslint-disable-next-line no-console
    console.log(`📊 Generated ${formattedEvents.length} calendar events: ${formattedEvents.filter(e => e.extendedProps.isAvailable).length} available, ${formattedEvents.filter(e => e.extendedProps.source === 'google-blocked').length} Google blocked, ${formattedEvents.filter(e => e.extendedProps.source === 'booked').length} booked`);

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