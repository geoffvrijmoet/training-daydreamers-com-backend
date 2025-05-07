import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  name: string;
  dogName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema: Schema<IClient> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dogName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      // Consider adding a regex for email validation if needed
      // match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    // 'folders' field is intentionally omitted as per instructions
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

const Client = mongoose.models.Client || mongoose.model<IClient>('Client', clientSchema);

export default Client; 