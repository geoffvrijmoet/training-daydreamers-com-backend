import { MongoClient, ObjectId } from 'mongodb';
import { config as dotenvConfig } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname replacement
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line no-underscore-dangle
const __dirnameES = dirname(__filename);

// Load variables from project root `.env.local` (if not already in env)
dotenvConfig({ path: resolve(__dirnameES, '..', '.env.local'), override: false });

/**
 * One-time migration: ensure every embedded item inside the `settings` document
 * (type="training_options") has its own MongoDB ObjectId _id field. We also
 * overwrite/replace the existing `id` string with the hex representation of
 * that ObjectId so the UI logic that still relies on the `id` property keeps
 * working without changes.
 *
 * Safe to run multiple times – already-migrated items are skipped.
 *
 * Usage (from repo root):
 *   npx ts-node scripts/migrate-settings-subdoc-ids.ts
 */
async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI env variable');
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('training_daydreamers');

  const settingsColl = db.collection('settings');
  const settingsDoc = await settingsColl.findOne({ type: 'training_options' });

  if (!settingsDoc) {
    console.log('No settings document with type="training_options" found – nothing to migrate.');
    await client.close();
    return;
  }

  let modified = false;

  // Helper to process an array of plain objects (e.g. keyConcepts)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function processArray(arr: any[] | undefined): any[] | undefined {
    if (!Array.isArray(arr)) return arr;

    return arr.map((item) => {
      if (item && !item._id) {
        const newId = new ObjectId();
        item._id = newId;
        item.id = newId.toHexString();
        modified = true;
      } else if (item && item._id && typeof item.id !== 'string') {
        // Ensure `id` string mirrors _id if it was lost / not a string
        item.id = item._id.toHexString();
        modified = true;
      }
      return item;
    });
  }

  // Fields that are simple arrays of items
  const simpleArrays = [
    'keyConcepts',
    'productRecommendations',
    'gamesAndActivities',
    'homework',
    'trainingSkills',
    'sessionOfferings',
    'packageDefinitions',
  ] as const;

  // Clone doc to mutate locally
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatedDoc: any = { ...settingsDoc };

  for (const field of simpleArrays) {
    updatedDoc[field] = processArray(settingsDoc[field]);
  }

  // Handle customCategories (each category has its own items array)
  if (Array.isArray(settingsDoc.customCategories)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatedDoc.customCategories = settingsDoc.customCategories.map((cat: any) => {
      // Give categories themselves an _id if missing
      if (!cat._id) {
        const catId = new ObjectId();
        cat._id = catId;
        cat.id = catId.toHexString();
        modified = true;
      } else if (cat._id && typeof cat.id !== 'string') {
        cat.id = cat._id.toHexString();
        modified = true;
      }

      cat.items = processArray(cat.items);
      return cat;
    });
  }

  if (!modified) {
    console.log('All embedded settings items already have _id – nothing to update.');
    await client.close();
    return;
  }

  // Perform the update in the collection
  await settingsColl.updateOne(
    { _id: settingsDoc._id },
    { $set: updatedDoc }
  );

  console.log('Migration complete – settings document updated.');
  await client.close();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 