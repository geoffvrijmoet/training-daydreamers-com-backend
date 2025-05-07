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

export interface ISettings extends Document {
  type: string; // e.g., "training_options"
  keyConcepts?: ISettingItem[];
  productRecommendations?: ISettingProductRecommendation[];
  gamesAndActivities?: ISettingItem[];
  homework?: ISettingItem[]; // Assuming similar structure, though example is empty
  trainingSkills?: ISettingItem[];
  customCategories?: ICustomCategory[];
  // No timestamps needed as per example, assuming single document rarely updated
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
  },
  {
    timestamps: false, // Explicitly disable timestamps
    // versionKey: false, // Optional: to remove __v field
  }
);

const Setting = mongoose.models.Setting || mongoose.model<ISettings>('Setting', settingsSchema);

export default Setting; 