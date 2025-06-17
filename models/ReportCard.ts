import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for product recommendations, adjust if structure is more complex
interface IProductRecommendation {
  id: string;
  title: string;
  description?: string;
  url?: string;
}

export interface ISelectedItemGroup {
  category: string;
  items: {
    itemId: Types.ObjectId;
    customDescription?: string;
  }[];
}

export interface IReportCard extends Document {
  clientId?: Types.ObjectId;
  clientName?: string;
  dogName?: string;
  date?: string;
  summary?: string;
  selectedItemGroups?: ISelectedItemGroup[];
  productRecommendationIds?: Types.ObjectId[];
  fileId?: string;
  webViewLink?: string;
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
    selectedItemGroups: [
      {
        category: { type: String, required: true, trim: true },
        items: [
          {
            itemId: { type: Schema.Types.ObjectId, required: true },
            customDescription: { type: String, default: '' },
          },
        ],
      },
    ],
    productRecommendationIds: [{ type: Schema.Types.ObjectId, ref: 'Setting' }],
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