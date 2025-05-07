import mongoose, { Schema, Document } from 'mongoose';

// Interface for common item structure (e.g., key concepts, games, skills)
interface ISettingItem {
  id: string;
  title: string;
  description: string; // HTML content as string
  url?: string; // Optional URL for items like gamesAndActivities
}

// Interface for product recommendations within settings
interface ISettingProductRecommendation {
  id: string;
  title: string;
  description?: string; // Often empty for products in the example
  url?: string;
}

// Interface for custom category items
interface ICustomCategoryItem {
  id: string;
  title: string;
  description: string; // HTML content as string
  url?: string; // Optional, e.g., for links within description
}

// Interface for custom categories
interface ICustomCategory {
  id: string;
  name: string;
  items: ICustomCategoryItem[];
}

// --- New interfaces for Scheduling Service Definitions ---
export interface ISingleSessionOffering {
  id: string; // e.g., "private_1hr_session"
  title: string; // e.g., "Private 1-Hour Session"
  description?: string;
  durationMinutes: number;
  currentPrice: number;
  isActive: boolean; // So Madeline can toggle offerings
}

export interface IPackageDefinition {
  id: string; // e.g., "puppy_starter_3_sessions"
  title: string; // e.g., "Puppy Starter Package (3 Sessions)"
  description?: string;
  numberOfSessions: number;
  currentTotalPrice: number;
  isActive: boolean; // So Madeline can toggle offerings
  // individualSessionPrice?: number; // Optional: for display or pro-rating logic if needed
}
// --- End New Interfaces ---

export interface ISettings extends Document {
  type: string; // e.g., "training_options" or potentially "service_offerings"
  keyConcepts?: ISettingItem[];
  productRecommendations?: ISettingProductRecommendation[];
  gamesAndActivities?: ISettingItem[];
  homework?: ISettingItem[]; // Assuming similar structure, though example is empty
  trainingSkills?: ISettingItem[];
  customCategories?: ICustomCategory[];

  // --- New fields for Scheduling Service Definitions ---
  sessionOfferings?: ISingleSessionOffering[];
  packageDefinitions?: IPackageDefinition[];
  // --- End New Fields ---
}

const settingItemSchema: Schema<ISettingItem> = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true }, // Storing HTML as string
  url: { type: String, trim: true },
}, { _id: false });

const settingProductRecommendationSchema: Schema<ISettingProductRecommendation> = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  url: { type: String, trim: true },
}, { _id: false });

const customCategoryItemSchema: Schema<ICustomCategoryItem> = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  url: { type: String, trim: true },
}, { _id: false });

const customCategorySchema: Schema<ICustomCategory> = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  items: [customCategoryItemSchema],
}, { _id: false });

// --- New Schemas for Scheduling Service Definitions ---
const singleSessionOfferingSchema: Schema<ISingleSessionOffering> = new mongoose.Schema({
  id: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  durationMinutes: { type: Number, required: true },
  currentPrice: { type: Number, required: true },
  isActive: { type: Boolean, default: true, required: true },
}, { _id: false });

const packageDefinitionSchema: Schema<IPackageDefinition> = new mongoose.Schema({
  id: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  numberOfSessions: { type: Number, required: true },
  currentTotalPrice: { type: Number, required: true },
  isActive: { type: Boolean, default: true, required: true },
}, { _id: false });
// --- End New Schemas ---

const settingsSchema: Schema<ISettings> = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
      // Example: "training_options"
    },
    keyConcepts: [settingItemSchema],
    productRecommendations: [settingProductRecommendationSchema],
    gamesAndActivities: [settingItemSchema],
    homework: [settingItemSchema], // Assuming similar structure
    trainingSkills: [settingItemSchema],
    customCategories: [customCategorySchema],

    // --- New fields for Scheduling Service Definitions ---
    sessionOfferings: [singleSessionOfferingSchema],
    packageDefinitions: [packageDefinitionSchema],
    // --- End New Fields ---
  },
  {
    timestamps: false, // Explicitly disable timestamps
    // versionKey: false, // Optional: to remove __v field
  }
);

const Setting = mongoose.models.Setting || mongoose.model<ISettings>('Setting', settingsSchema, 'settings');

export default Setting; 