import mongoose, { Document, Schema } from 'mongoose';

export interface IGoogleCalendarConnection extends Document {
  userId: string;
  googleUserId: string;
  googleEmail: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  calendarIds: string[]; // Array of calendar IDs the user wants to sync
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GoogleCalendarConnectionSchema = new Schema<IGoogleCalendarConnection>({
  userId: {
    type: String,
    required: true
  },
  googleUserId: {
    type: String,
    required: true
  },
  googleEmail: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  tokenExpiry: {
    type: Date,
    required: true
  },
  calendarIds: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastSyncAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries - removed individual indexes to prevent unique constraints
GoogleCalendarConnectionSchema.index({ userId: 1, googleUserId: 1, isActive: 1 });
GoogleCalendarConnectionSchema.index({ userId: 1, isActive: 1 });
GoogleCalendarConnectionSchema.index({ googleUserId: 1 });

export default mongoose.models.GoogleCalendarConnection || 
  mongoose.model<IGoogleCalendarConnection>('GoogleCalendarConnection', GoogleCalendarConnectionSchema); 