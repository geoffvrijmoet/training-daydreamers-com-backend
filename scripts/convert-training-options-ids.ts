import { MongoClient, ObjectId } from 'mongodb';

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI env var is required');
  process.exit(1);
}

const clientPromise = (async () => {
  const client = new MongoClient(process.env.MONGODB_URI as string, {
    maxPoolSize: 5,
  });
  return client.connect();
})();

(async () => {
  const client = await clientPromise;
  const db = client.db('training_daydreamers');

  const doc = await db.collection('settings').findOne({ type: 'training_options' });
  if (!doc) {
    console.error('training_options document not found'); process.exit(1);
  }

  // utility: convert every item in an array (if present)
  const convertArr = (arr?: any[]) =>
    Array.isArray(arr)
      ? arr.map((it) => {
          if (!it) return it;
          if (!it._id) it._id = new ObjectId();     // give it a new ObjectId
          if (it.id) it.legacyId = it.id;           // preserve old string
          delete it.id;
          return it;
        })
      : arr;

  // top-level arrays
  doc.keyConcepts          = convertArr(doc.keyConcepts);
  doc.productRecommendations = convertArr(doc.productRecommendations);
  doc.gamesAndActivities   = convertArr(doc.gamesAndActivities);
  doc.homework             = convertArr(doc.homework);
  doc.trainingSkills       = convertArr(doc.trainingSkills);

  // customCategories: iterate each sub-array
  if (Array.isArray(doc.customCategories)) {
    doc.customCategories = doc.customCategories.map((cat: any) => ({
      ...cat,
      items: convertArr(cat.items),
    }));
  }

  await db
    .collection('settings')
    .updateOne({ _id: doc._id }, { $set: doc });

  console.log('✅  All training_option ids have ObjectIds (old ids preserved as legacyId)');
  process.exit(0);
})();
