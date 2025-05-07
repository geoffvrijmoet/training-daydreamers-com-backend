import mongoose, { Schema, Document } from 'mongoose';

interface IQrCodeStyle {
  darkColor?: string;
  lightColor?: string;
  isTransparent?: boolean;
  cornerSquareStyle?: string;
  dotsStyle?: string;
}

export interface IQrCode extends Document {
  name: string;
  type: string;
  url: string;
  description?: string;
  qrCodeUrl?: string;
  style?: IQrCodeStyle;
  createdAt: Date;
}

const qrCodeStyleSchema: Schema<IQrCodeStyle> = new mongoose.Schema({
  darkColor: { type: String, default: '#000000' },
  lightColor: { type: String, default: '#ffffff' },
  isTransparent: { type: Boolean, default: false },
  cornerSquareStyle: { type: String, default: 'square' }, // Consider enum if there are fixed values
  dotsStyle: { type: String, default: 'square' }, // Consider enum if there are fixed values
}, { _id: false });

const qrCodeSchema: Schema<IQrCode> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    qrCodeUrl: {
      type: String,
      trim: true,
    },
    style: qrCodeStyleSchema,
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false }, // Only manage createdAt
  }
);

const QrCode = mongoose.models.QrCode || mongoose.model<IQrCode>('QrCode', qrCodeSchema);

export default QrCode; 