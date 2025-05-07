import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICalendarTimeslot extends Document {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  bookedByClientId?: Types.ObjectId | null; // Ref to Client model
  sessionId?: Types.ObjectId | null; // Ref to Session model, set when booked for a single session
  packageInstanceId?: Types.ObjectId | null; // Ref to PackageInstance model, set if part of a package booking
  googleCalendarEventId?: string | null; // For future Google Calendar sync
  notes?: string; // Notes by Madeline about this specific timeslot (e.g., "Location: park entrance")
  repeatingSeriesId?: string | null; // Identifier for grouping slots created from the same repeating event
}

const calendarTimeslotSchema: Schema<ICalendarTimeslot> = new mongoose.Schema(
  {
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      required: true,
    },
    bookedByClientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
      // unique: true, // A session is unique to a timeslot, but a timeslot might not have a session if it's just blocked/available
      // sparse: true, // Allows multiple nulls if unique is true
    },
    packageInstanceId: {
      type: Schema.Types.ObjectId,
      ref: 'PackageInstance',
      default: null,
    },
    googleCalendarEventId: {
      type: String,
      trim: true,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
    repeatingSeriesId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
  },
  {
    timestamps: false, // No default createdAt/updatedAt for timeslots
    // Ensure startTime and endTime are indexed for efficient querying of availability
    // index: { startTime: 1, endTime: 1 }, // This might be too broad, consider specific needs
  }
);

// Index for finding available slots in a time range
calendarTimeslotSchema.index({ startTime: 1, isAvailable: 1 });
calendarTimeslotSchema.index({ endTime: 1 }); // For cleanup logic

// Compound index to prevent duplicate timeslots if Madeline accidentally creates overlapping ones.
// This depends on business logic: should exact duplicate start/end times be prevented?
// calendarTimeslotSchema.index({ startTime: 1, endTime: 1 }, { unique: true });

const CalendarTimeslot = mongoose.models.CalendarTimeslot || mongoose.model<ICalendarTimeslot>('CalendarTimeslot', calendarTimeslotSchema, 'calendar_timeslots');

export default CalendarTimeslot; 