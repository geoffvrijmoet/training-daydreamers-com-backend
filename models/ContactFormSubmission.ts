import mongoose, { Schema, Document } from 'mongoose';

export interface IContactFormSubmission extends Document {
  name: string;
  dogName?: string;
  dogBirthdate?: string; // Consider using Date type if appropriate and transforming on input
  email: string;
  phone?: string;
  zipCode?: string;
  message: string;
  submittedAt: Date;
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
  },
  {
    timestamps: { createdAt: 'submittedAt', updatedAt: false }, // Use submittedAt for createdAt, disable updatedAt
  }
);

const ContactFormSubmission = mongoose.models.ContactFormSubmission || mongoose.model<IContactFormSubmission>('ContactFormSubmission', contactFormSubmissionSchema, "contact_form_submissions");

export default ContactFormSubmission; 