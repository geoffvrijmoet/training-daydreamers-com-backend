import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPackageInstance extends Document {
  clientId: Types.ObjectId; // Ref to Client model
  packageDefinitionId: string; // Identifier for the package definition from settings (e.g., "3_session_pack_q1_2024")
  packageTitle: string; // User-friendly title of the package, copied from definition (e.g., "3 Session Puppy Package")
  status: 'pending_scheduling' | 'partially_scheduled' | 'fully_scheduled' | 'completed' | 'cancelled_by_client' | 'cancelled_by_admin';
  totalQuotedPrice: number;
  numberOfSessionsInPackage: number; // Copied from the package definition at time of booking
  scheduledSessionIds: Types.ObjectId[]; // Array of refs to Session model
  createdAt: Date;
  updatedAt: Date;
}

const packageInstanceSchema: Schema<IPackageInstance> = new mongoose.Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    packageDefinitionId: {
      type: String, // Not a direct DB ref, but an ID defined in settings, e.g., "package_3_sessions"
      required: true,
      trim: true,
    },
    packageTitle: { // Store the title at the time of booking for historical reference
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending_scheduling', 'partially_scheduled', 'fully_scheduled', 'completed', 'cancelled_by_client', 'cancelled_by_admin'],
      required: true,
      default: 'pending_scheduling',
    },
    totalQuotedPrice: {
      type: Number,
      required: true,
    },
    numberOfSessionsInPackage: {
      type: Number,
      required: true,
    },
    scheduledSessionIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Session',
      },
    ],
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

packageInstanceSchema.index({ clientId: 1 });

const PackageInstance = mongoose.models.PackageInstance || mongoose.model<IPackageInstance>('PackageInstance', packageInstanceSchema, 'package_instances');

export default PackageInstance; 