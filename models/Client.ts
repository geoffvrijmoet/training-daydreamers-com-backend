import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  name: string;
  dogName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  dogBirthdate?: Date;
  zipCode?: string;
  
  // Personal Information
  pronouns?: string;
  
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
  
  // Emergency Contact
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  
  // Additional / Co-Owner Contacts (multiple allowed)
  additionalContacts?: Array<{
    name?: string;
    email?: string;
    phone?: string;
  }>;
  
  // Additional Dog Information (for multiple dogs)
  additionalDogs?: Array<{
    name?: string;
    birthdate?: Date;
    breed?: string;
    weight?: number;
    reproductiveStatus?: 'spayed' | 'neutered' | 'intact';
  }>;
  
  // Enhanced Dog Information
  dogInfo?: {
    breed?: string;
    weight?: number;
    spayedNeutered?: boolean;
    reproductiveStatus?: 'spayed' | 'neutered' | 'intact';
    behaviorConcerns?: string[];
    previousTraining?: boolean;
    previousTrainingDetails?: string;
    source?: string; // Where they got the dog
    timeWithDog?: string; // How long they've had the dog
    diet?: string; // What the dog eats
    favoriteThing?: string; // For training motivation
  };
  
  // Household Information
  householdInfo?: {
    otherPets?: Array<{
      type?: string;
      name?: string;
      age?: string;
    }>;
    childrenInHousehold?: boolean;
    childrenAges?: string;
    allergies?: {
      human?: string[];
      dog?: string[];
    };
  };
  
  // Medical Information
  medicalInfo?: {
    veterinarian?: {
      name?: string;
      clinic?: string;
      phone?: string;
    };
    medicalIssues?: string[];
    currentMedications?: Array<{
      name?: string;
      dosage?: string;
      prescribedFor?: string;
    }>;
    pastBehavioralMedications?: Array<{
      name?: string;
      prescribedFor?: string;
    }>;
  };
  
  // Behavioral Information
  behavioralInfo?: {
    trainingGoals?: string; // Primary reason for seeking training
    biteHistory?: {
      hasBitten?: boolean;
      incidents?: Array<{
        description?: string;
        date?: Date;
        severity?: string;
      }>;
    };
    behavioralIssues?: string[];
    additionalNotes?: string; // "Anything else you'd like me to know"
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
    
    // Personal Information
    pronouns: {
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
    
    // Emergency Contact
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
    
    // Additional / Co-Owner Contacts (multiple allowed)
    additionalContacts: {
      type: [{
        name: { type: String },
        email: { type: String, lowercase: true },
        phone: { type: String },
      }],
      default: []
    },
    
    // Additional Dog Information (for multiple dogs)
    additionalDogs: {
      type: [{
        name: { type: String },
        birthdate: { type: Date },
        breed: { type: String },
        weight: { type: Number },
        reproductiveStatus: { 
          type: String, 
          enum: ['spayed', 'neutered', 'intact'] 
        },
      }],
      default: []
    },
    
    // Enhanced Dog Information
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
      reproductiveStatus: { 
        type: String, 
        enum: ['spayed', 'neutered', 'intact'] 
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
      source: {
        type: String,
      },
      timeWithDog: {
        type: String,
      },
      diet: {
        type: String,
      },
      favoriteThing: {
        type: String,
      },
    },
    
    // Household Information
    householdInfo: {
      otherPets: [{
        type: { type: String },
        name: { type: String },
        age: { type: String },
      }],
      childrenInHousehold: {
        type: Boolean,
      },
      childrenAges: {
        type: String,
      },
      allergies: {
        human: [{ type: String }],
        dog: [{ type: String }],
      },
    },
    
    // Medical Information
    medicalInfo: {
      veterinarian: {
        name: { type: String },
        clinic: { type: String },
        phone: { type: String },
      },
      medicalIssues: [{ type: String }],
      currentMedications: [{
        name: { type: String },
        dosage: { type: String },
        prescribedFor: { type: String },
      }],
      pastBehavioralMedications: [{
        name: { type: String },
        prescribedFor: { type: String },
      }],
    },
    
    // Behavioral Information
    behavioralInfo: {
      trainingGoals: {
        type: String,
      },
      biteHistory: {
        hasBitten: { type: Boolean },
        incidents: [{
          description: { type: String },
          date: { type: Date },
          severity: { type: String },
        }],
      },
      behavioralIssues: [{ type: String }],
      additionalNotes: { type: String },
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