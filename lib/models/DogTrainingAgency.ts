import mongoose, { Schema, Document } from 'mongoose';

export interface IDogTrainingAgency extends Document {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  website?: string;
  revenueSharePercentage: number; // 0-100
  handlesSalesTax: boolean;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DogTrainingAgencySchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true }
  },
  website: {
    type: String,
    trim: true
  },
  revenueSharePercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  handlesSalesTax: {
    type: Boolean,
    required: true,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'dog_training_agencies' // Explicitly set collection name with underscores
});

// Indexes for efficient querying
DogTrainingAgencySchema.index({ name: 1 });
DogTrainingAgencySchema.index({ isActive: 1 });
DogTrainingAgencySchema.index({ createdAt: -1 });

export default mongoose.models.DogTrainingAgency || mongoose.model<IDogTrainingAgency>('DogTrainingAgency', DogTrainingAgencySchema); 