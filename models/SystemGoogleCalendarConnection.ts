import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemGoogleCalendarConnection extends Document {
  connectionName: string; // e.g., "Madeline's Primary Calendar"
  googleUserId: string;
  googleEmail: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  calendarIds: string[]; // Array of calendar IDs to sync
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SystemGoogleCalendarConnectionSchema = new Schema<ISystemGoogleCalendarConnection>({
  connectionName: {
    type: String,
    required: true,
    default: "System Calendar"
  },
  googleUserId: {
    type: String,
    required: true,
    unique: true // Only one system connection per Google account
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

// Indexes for efficient queries
SystemGoogleCalendarConnectionSchema.index({ isActive: 1 });
SystemGoogleCalendarConnectionSchema.index({ googleUserId: 1 });

export default mongoose.models.SystemGoogleCalendarConnection || 
  mongoose.model<ISystemGoogleCalendarConnection>('SystemGoogleCalendarConnection', SystemGoogleCalendarConnectionSchema, "system_google_calendar_connections");
