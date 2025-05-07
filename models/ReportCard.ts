import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for product recommendations, adjust if structure is more complex
interface IProductRecommendation {
  id: string;
  title: string;
  description?: string;
  url?: string;
}

export interface IReportCard extends Document {
  clientId?: Types.ObjectId; // Optional as per the example, but usually would be required
  clientName?: string;
  dogName?: string;
  date?: string; // Consider Date type
  summary?: string;
  keyConcepts?: string[];
  productRecommendations?: IProductRecommendation[];
  fileId?: string; // Relates to Google Drive, consider removal if no longer used
  webViewLink?: string; // Relates to Google Drive, consider removal if no longer used
  createdAt: Date;
}

const productRecommendationSchema: Schema<IProductRecommendation> = new mongoose.Schema({}, { _id: false, strict: false });

const reportCardSchema: Schema<IReportCard> = new mongoose.Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      // required: true, // Usually a report card is tied to a client
    },
    clientName: {
      type: String,
      trim: true,
    },
    dogName: {
      type: String,
      trim: true,
    },
    date: {
      type: String, // As per example, consider Date type
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    keyConcepts: [
      {
        type: String,
        trim: true,
      },
    ],
    productRecommendations: [productRecommendationSchema], // Array of product recommendations
    fileId: {
      type: String, // As per example, consider if this is still needed
      trim: true,
    },
    webViewLink: {
      type: String, // As per example, consider if this is still needed
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false }, // Only manage createdAt
  }
);

const ReportCard = mongoose.models.ReportCard || mongoose.model<IReportCard>('ReportCard', reportCardSchema, "report_cards");

export default ReportCard; 