import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Helper to determine whether a value can be safely converted to an ObjectId
function toObjectIdIfValid(id: unknown) {
  if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
    return new ObjectId(id);
  }
  return id;
}

// This handles GET requests to /api/report-cards
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    
    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    const { ObjectId } = await import('mongodb');
    let query: Record<string, unknown> = {};
    if (clientId) {
      query = { clientId: new ObjectId(clientId) };
    }
    
    const reportCardsRaw = await db.collection('report_cards')
      .find(query)
      .sort({ date: -1, createdAt: -1 })
      .toArray();

    // Fetch settings once for mapping
    const settings = await db.collection('settings').findOne({ type: 'training_options' });

    // Build a map of ObjectId hex -> option object (title, description) for quick lookup
    const optionMap: Record<string, { title: string; description: string }> = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addToMap = (arr?: any[]) => {
      if (!Array.isArray(arr)) return;
      for (const item of arr) {
        if (!item) continue;
        const payload = { title: item.title, description: item.description };
        // Map by any identifier we can find, regardless of whether _id exists
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
        for (const cat of settings.customCategories) {
          addToMap(cat.items);
        }
      }
    }

    // Transform each report card for frontend consumption
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reportCards = reportCardsRaw.map((card: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selectedItems = (card.selectedItemGroups || []).map((group: any) => ({
        category: group.category,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: (group.items || []).map((it: any) => {
          const key = typeof it.itemId === 'object' && it.itemId?.$oid ? it.itemId.$oid : it.itemId?.toString?.();
          const base = (key && optionMap[key]) || { title: 'Unknown', description: '' };
          return {
            title: base.title,
            description: it.customDescription && it.customDescription.length > 0 ? it.customDescription : base.description,
          };
        }),
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productRecommendations = (card.productRecommendationIds || []).map((id: any) => optionMap[id.toString()]?.title || 'Unknown');

      return {
        ...card,
        selectedItems,
        productRecommendations,
      };
    });

    return NextResponse.json({ success: true, reportCards });
  } catch (error) {
    console.error('Error fetching report cards:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report cards' },
      { status: 500 }
    );
  }
}

// This handles POST requests to /api/report-cards
export async function POST(request: Request) {
  try {
    // 1. Get the data from the request body
    const data = await request.json();

    // 2. Save to MongoDB
    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    // transform incoming strings to ObjectIds
    const { ObjectId } = await import('mongodb');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedGroups = (data.selectedItemGroups || []).map((group: any) => ({
      category: group.category,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (group.items || []).map((it: any) => ({
        itemId: toObjectIdIfValid(it.itemId),
        customDescription: it.customDescription || '',
      })),
    }));

    const productRecommendationIds = (data.productRecommendationIds || []).map((id: string) => toObjectIdIfValid(id));

    // Check if there's an existing draft to update
    if (data.draftId) {
      // Update existing draft to mark it as finished
      const result = await db.collection('report_cards').updateOne(
        { _id: new ObjectId(data.draftId) },
        { 
          $set: {
            clientId: toObjectIdIfValid(data.clientId),
            clientName: data.clientName,
            dogName: data.dogName,
            date: data.date,
            summary: data.summary,
            selectedItemGroups: transformedGroups,
            productRecommendationIds,
            shortTermGoals: data.shortTermGoals || [],
            additionalContacts: data.additionalContacts || [],
            isDraft: false,
            updatedAt: new Date(),
          }
        }
      );
      
      return NextResponse.json({ 
        success: true, 
        reportCardId: data.draftId
      });
    } else {
      // Create new report card (no draft existed)
      const result = await db.collection('report_cards').insertOne({
        clientId: toObjectIdIfValid(data.clientId),
        clientName: data.clientName,
        dogName: data.dogName,
        date: data.date,
        summary: data.summary,
        selectedItemGroups: transformedGroups,
        productRecommendationIds,
        shortTermGoals: data.shortTermGoals || [],
        additionalContacts: data.additionalContacts || [],
        isDraft: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      return NextResponse.json({ 
        success: true, 
        reportCardId: result.insertedId
      });
    }

  } catch (error) {
    // 4. Handle errors
    console.error('Error creating report card:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create report card' },
      { status: 500 }
    );
  }
} 