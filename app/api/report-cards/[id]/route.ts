import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Helper to convert a value to ObjectId only when it is a 24-char hex string
function toObjectIdIfValid(id: unknown) {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id) ? new ObjectId(id) : id;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    const reportCardRaw = await db.collection('report_cards').findOne({
      _id: new ObjectId(params.id)
    });

    console.log('[RC VIEW] Fetch raw selectedItemGroups:', JSON.stringify(reportCardRaw?.selectedItemGroups, null, 2));

    if (!reportCardRaw) {
      return NextResponse.json(
        { success: false, error: 'Report card not found' },
        { status: 404 }
      );
    }

    // Fetch settings for option lookup
    const settings = await db.collection('settings').findOne({ type: 'training_options' });

    const optionMap: Record<string, { title: string; description: string }> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addToMap = (arr?: any[]) => {
      if (!Array.isArray(arr)) return;
      for (const item of arr) {
        if (!item) continue;
        const payload = { title: item.title, description: item.description };
        if (item._id) {
          const idStr = typeof item._id === 'object' && item._id.$oid ? item._id.$oid : item._id.toString();
          optionMap[idStr] = payload;
        }
        if (item.id) optionMap[item.id.toString()] = payload;
        if (item.legacyId) optionMap[item.legacyId.toString()] = payload;
      }
    };

    if (settings) {
      addToMap(settings.keyConcepts);
      addToMap(settings.gamesAndActivities);
      addToMap(settings.trainingSkills);
      addToMap(settings.homework);
      addToMap(settings.productRecommendations);
      if (Array.isArray(settings.customCategories)) {
        for (const cat of settings.customCategories) addToMap(cat.items);
      }
    }

    console.log('[RC VIEW] optionMap keys count:', Object.keys(optionMap).length);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectedItems = (reportCardRaw.selectedItemGroups || []).map((group: any) => ({
      category: group.category,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (group.items || []).map((it: any) => {
        const key = typeof it.itemId === 'object' && it.itemId?.$oid
          ? it.itemId.$oid
          : it.itemId?.toString?.();
        const base = (key && optionMap[key]) || { title: 'Unknown', description: '' };
        if (!optionMap[key]) {
          console.warn('[RC VIEW] Unknown itemId not found in optionMap:', key);
        }
        return {
          title: base.title,
          description: it.customDescription && it.customDescription.length > 0 ? it.customDescription : base.description,
        };
      }),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productRecommendations = (reportCardRaw.productRecommendationIds || []).map((id: any) => optionMap[id.toString()]?.title || 'Unknown');

    type ReportCardResponse = typeof reportCardRaw & {
      selectedItems: Array<{ category: string; items: Array<{ title: string; description: string }> }>;
      productRecommendations: string[];
      selectedItemGroupsRaw: unknown;
      clientEmail?: string;
      additionalContacts?: Array<{ name?: string; email?: string; phone?: string }>;
    };

    const reportCard: ReportCardResponse = {
      ...(reportCardRaw as ReportCardResponse),
      selectedItems,
      productRecommendations,
      selectedItemGroupsRaw: reportCardRaw.selectedItemGroups,
    };

    // Fetch client email to include in preview recipients
    try {
      const clientDoc = await db.collection('clients').findOne({ _id: new ObjectId(reportCardRaw.clientId) });
      // Attach email if found; do not overwrite any existing fields
      reportCard.clientEmail = clientDoc?.email || '';
      // If report card lacks additionalContacts, fall back to client doc's additionalContacts
      if (!reportCard.additionalContacts && clientDoc?.additionalContacts) {
        reportCard.additionalContacts = clientDoc.additionalContacts as Array<{ name?: string; email?: string; phone?: string }>;
      }
    } catch {
      // Non-fatal if client lookup fails; UI will just omit email
    }

    return NextResponse.json({ success: true, reportCard });
  } catch (error) {
    console.error('Error fetching report card:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report card' },
      { status: 500 }
    );
  }
}

// PUT: update report card
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { date, summary, selectedItemGroups, shortTermGoals } = body;

    const client = await clientPromise;
    const db = client.db('training_daydreamers');

    const { ObjectId } = await import('mongodb');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedGroups = (selectedItemGroups || []).map((group: any) => ({
      category: group.category,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (group.items || []).map((it: any) => ({
        itemId: toObjectIdIfValid(it.itemId),
        customDescription: it.customDescription || '',
      })),
    }));

    await db.collection('report_cards').updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          date,
          summary,
          selectedItemGroups: transformedGroups,
          shortTermGoals: shortTermGoals || [],
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating report card:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update report card' },
      { status: 500 }
    );
  }
} 