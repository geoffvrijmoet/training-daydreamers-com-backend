import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISession extends Document {
  clientId: Types.ObjectId; // Ref to Client model
  calendarTimeslotId: Types.ObjectId; // Ref to CalendarTimeslot model
  packageInstanceId?: Types.ObjectId; // Optional ref to PackageInstance model
  status: 'pending_payment' | 'scheduled' | 'completed' | 'cancelled_by_client' | 'cancelled_by_admin' | 'rescheduled';
  quotedPrice: number;
  sessionNotes?: string; // Notes by Madeline, or system notes
  googleCalendarEventId?: string; // For future Google Calendar sync
  isFirstSession: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema: Schema<ISession> = new mongoose.Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    calendarTimeslotId: {
      type: Schema.Types.ObjectId,
      ref: 'CalendarTimeslot',
      required: true,
      unique: true, // A timeslot can only be used for one session
    },
    packageInstanceId: {
      type: Schema.Types.ObjectId,
      ref: 'PackageInstance',
      required: false,
    },
    status: {
      type: String,
      enum: ['pending_payment', 'scheduled', 'completed', 'cancelled_by_client', 'cancelled_by_admin', 'rescheduled'],
      required: true,
      default: 'pending_payment',
    },
    quotedPrice: {
      type: Number,
      required: true,
    },
    sessionNotes: {
      type: String,
      trim: true,
    },
    googleCalendarEventId: {
      type: String,
      trim: true,
    },
    isFirstSession: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Ensure index for common queries if needed, e.g., on clientId and date (via timeslot)
// sessionSchema.index({ clientId: 1, 'calendarTimeslotId.startTime': 1 }); // Example if timeslot is populated

const Session = mongoose.models.Session || mongoose.model<ISession>('Session', sessionSchema, 'sessions');

export default Session; 