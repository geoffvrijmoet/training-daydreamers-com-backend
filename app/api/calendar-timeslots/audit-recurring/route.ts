import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/db';
import CalendarTimeslotModel from '@/models/CalendarTimeslot';
import { fromZonedTime } from 'date-fns-tz';

const TIME_ZONE = "America/New_York";
const RECURRING_WEEKS_AHEAD = 6;

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    
    const now = new Date();
    const today = fromZonedTime(new Date(now.getFullYear(), now.getMonth(), now.getDate()), TIME_ZONE);
    
    // 1. Find all unique repeatingSeriesId values
    const recurringSeriesIds = await CalendarTimeslotModel.distinct('repeatingSeriesId', {
      repeatingSeriesId: { $ne: null, $exists: true }
    });
    
    let createdCount = 0;
    let deletedCount = 0;
    
    // 2. For each recurring series, ensure we have timeslots for the next 6 weeks
    for (const seriesId of recurringSeriesIds) {
      // Get the original (earliest) timeslot for this series to understand the pattern
      const originalSlot = await CalendarTimeslotModel.findOne({
        repeatingSeriesId: seriesId
      }).sort({ startTime: 1 });
      
      if (!originalSlot) continue;
      
      // Calculate what dates should exist for this series
      const originalDate = new Date(originalSlot.startTime);
      const dayOfWeek = originalDate.getDay();
      const timeOfDay = originalDate.getHours() * 60 + originalDate.getMinutes();
      const duration = originalSlot.endTime.getTime() - originalSlot.startTime.getTime();
      
      // Find the next occurrence of this day of week from today
      const nextDate = new Date(today);
      const daysUntilNext = (dayOfWeek - today.getDay() + 7) % 7;
      nextDate.setDate(today.getDate() + daysUntilNext);
      
      // If today is the same day of week but the time has passed, start from next week
      const todayTimeOfDay = now.getHours() * 60 + now.getMinutes();
      if (daysUntilNext === 0 && todayTimeOfDay > timeOfDay) {
        nextDate.setDate(nextDate.getDate() + 7);
      }
      
      // Generate dates for the next 6 weeks
      const requiredDates = [];
      for (let i = 0; i < RECURRING_WEEKS_AHEAD; i++) {
        const slotDate = new Date(nextDate);
        slotDate.setDate(nextDate.getDate() + (i * 7));
        slotDate.setHours(Math.floor(timeOfDay / 60), timeOfDay % 60, 0, 0);
        requiredDates.push(slotDate);
      }
      
      // Check which dates are missing and create them
      for (const requiredDate of requiredDates) {
        const existingSlot = await CalendarTimeslotModel.findOne({
          repeatingSeriesId: seriesId,
          startTime: {
            $gte: new Date(requiredDate.getTime() - 1000 * 60), // 1 minute tolerance
            $lte: new Date(requiredDate.getTime() + 1000 * 60)
          }
        });
        
        if (!existingSlot) {
          // Create the missing timeslot
          const newSlot = new CalendarTimeslotModel({
            startTime: requiredDate,
            endTime: new Date(requiredDate.getTime() + duration),
            isAvailable: true,
            notes: originalSlot.notes,
            repeatingSeriesId: seriesId
          });
          await newSlot.save();
          createdCount++;
        }
      }
    }
    
    // 3. Clean up old unbooked timeslots (older than today)
    const oldUnbookedSlots = await CalendarTimeslotModel.deleteMany({
      endTime: { $lt: today },
      isAvailable: true // Only delete available (unbooked) slots
    });
    deletedCount = oldUnbookedSlots.deletedCount || 0;
    
    return NextResponse.json({
      success: true,
      message: `Audit completed: ${createdCount} timeslots created, ${deletedCount} old unbooked timeslots deleted`,
      created: createdCount,
      deleted: deletedCount
    });
    
  } catch (error) {
    console.error("Error auditing recurring timeslots:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
} 