import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  name: string;
  dogName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  dogBirthdate?: Date;
  zipCode?: string;
  // Address fields (optional)
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  addressZipCode?: string;
  // Agency and backend information
  intakeSource?: 'direct' | 'agency';
  agencyName?: string;
  agencyRevenueShare?: number; // Percentage (0-100)
  agencyHandlesTax?: boolean;
  sessionRate?: number; // Per session rate in dollars
  packageInfo?: {
    packageName?: string;
    totalSessions?: number;
    sessionsUsed?: number;
    packagePrice?: number;
  };
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  dogInfo?: {
    breed?: string;
    weight?: number;
    spayedNeutered?: boolean;
    behaviorConcerns?: string[];
    previousTraining?: boolean;
    previousTrainingDetails?: string;
  };
  vaccinationRecords?: [{
    name: string;
    url: string;
    uploadedAt: Date;
    publicId?: string;
    resourceType?: string;
  }];
  dogPhoto?: {
    url?: string;
    uploadedAt?: Date;
    publicId?: string;
    resourceType?: string;
  };
  liabilityWaiver?: {
    url?: string;
    uploadedAt?: Date;
    publicId?: string;
    resourceType?: string;
  };
  waiverSigned?: {
    signed: boolean;
    signedAt: Date;
  };
  intakeCompleted?: boolean;
  adminNotes?: string; // Separate from client-visible notes
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
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      // Consider adding a regex for email validation if needed
      // match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    dogBirthdate: {
      type: Date,
    },
    zipCode: {
      type: String,
    },
    // Address fields (optional)
    addressLine1: {
      type: String,
    },
    addressLine2: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    addressZipCode: {
      type: String,
    },
    // Agency and backend information
    intakeSource: {
      type: String,
      enum: ['direct', 'agency'],
    },
    agencyName: {
      type: String,
    },
    agencyRevenueShare: {
      type: Number,
      min: 0,
      max: 100,
    },
    agencyHandlesTax: {
      type: Boolean,
    },
    sessionRate: {
      type: Number,
    },
    packageInfo: {
      packageName: {
        type: String,
      },
      totalSessions: {
        type: Number,
      },
      sessionsUsed: {
        type: Number,
      },
      packagePrice: {
        type: Number,
      },
    },
    emergencyContact: {
      name: {
        type: String,
      },
      phone: {
        type: String,
      },
      relationship: {
        type: String,
      },
    },
    dogInfo: {
      breed: {
        type: String,
      },
      weight: {
        type: Number,
      },
      spayedNeutered: {
        type: Boolean,
      },
      behaviorConcerns: [{
        type: String,
      }],
      previousTraining: {
        type: Boolean,
      },
      previousTrainingDetails: {
        type: String,
      },
    },
    vaccinationRecords: [{
      name: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
      publicId: {
        type: String,
      },
      resourceType: {
        type: String,
      },
    }],
    dogPhoto: {
      url: {
        type: String,
      },
      uploadedAt: {
        type: Date,
      },
      publicId: {
        type: String,
      },
      resourceType: {
        type: String,
      },
    },
    liabilityWaiver: {
      url: {
        type: String,
      },
      uploadedAt: {
        type: Date,
      },
      publicId: {
        type: String,
      },
      resourceType: {
        type: String,
      },
    },
    waiverSigned: {
      signed: {
        type: Boolean,
        default: false,
      },
      signedAt: {
        type: Date,
      },
    },
    intakeCompleted: {
      type: Boolean,
      default: false,
    },
    adminNotes: {
      type: String,
    },
    // 'folders' field is intentionally omitted as per instructions
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Update the updatedAt timestamp before saving
clientSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Client = mongoose.models.Client || mongoose.model<IClient>('Client', clientSchema);

export default Client; 