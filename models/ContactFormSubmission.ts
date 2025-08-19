import mongoose, { Schema, Document } from 'mongoose';

export interface IContactFormSubmission extends Document {
  name: string;
  dogName?: string;
  dogBirthdate?: string; // Consider using Date type if appropriate and transforming on input
  email: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  message: string;
  submittedAt: Date;
  reviewed?: boolean;
  reviewedAt?: Date;
  reviewedBy?: string;
  notes?: string;
}

const contactFormSubmissionSchema: Schema<IContactFormSubmission> = new mongoose.Schema(
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
    dogBirthdate: {
      type: String, // Storing as String as per example, but Date might be better
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      // match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
    },
    streetAddress: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    zipCode: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewed: {
      type: Boolean,
      default: false,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'submittedAt', updatedAt: false }, // Use submittedAt for createdAt, disable updatedAt
  }
);

const ContactFormSubmission = mongoose.models.ContactFormSubmission || mongoose.model<IContactFormSubmission>('ContactFormSubmission', contactFormSubmissionSchema, "contact_form_submissions");

export default ContactFormSubmission; 