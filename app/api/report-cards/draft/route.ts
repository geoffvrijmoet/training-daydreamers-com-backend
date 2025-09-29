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

// GET - Fetch existing draft for a client
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
    // Find the most recent draft for this client
    const draft = await db.collection('report_cards')
      .findOne(
        { 
          clientId: new ObjectId(clientId),
          isDraft: true
        },
        { sort: { updatedAt: -1 } }
      );

    if (!draft) {
      return NextResponse.json({ success: true, draft: null });
    }

    // Fetch settings for mapping
    const settings = await db.collection('settings').findOne({ type: 'training_options' });
    const optionMap: Record<string, { title: string; description: string; url?: string }> = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addToMap = (arr?: any[]) => {
      if (!Array.isArray(arr)) return;
      for (const item of arr) {
        if (!item) continue;
        const payload = { title: item.title, description: item.description, url: item.url };
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

    // Transform the draft for frontend consumption
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectedItems = (draft.selectedItemGroups || []).map((group: any) => ({
      category: group.category,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (group.items || []).map((it: any) => {
        const key = typeof it.itemId === 'object' && it.itemId?.$oid ? it.itemId.$oid : it.itemId?.toString?.();
        const base = (key && optionMap[key]) || { title: 'Unknown', description: '', url: undefined };
        return {
          id: key, // Preserve the original ID
          title: base.title,
          description: it.customDescription && it.customDescription.length > 0 ? it.customDescription : base.description,
          url: base.url,
        };
      }),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productRecommendations = (draft.productRecommendationIds || []).map((id: any) => {
      const idStr = id.toString();
      return {
        id: idStr,
        title: optionMap[idStr]?.title || 'Unknown'
      };
    });

    const transformedDraft = {
      ...draft,
      selectedItems,
      productRecommendations,
    };

    return NextResponse.json({ success: true, draft: transformedDraft });
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}

// POST - Save or update a draft
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const client = await clientPromise;
    const db = client.db('training_daydreamers');
    
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

    const draftData = {
      clientId: toObjectIdIfValid(data.clientId),
      clientName: data.clientName,
      dogName: data.dogName,
      date: data.date,
      summary: data.summary,
      selectedItemGroups: transformedGroups,
      productRecommendationIds,
      shortTermGoals: data.shortTermGoals || [],
      additionalContacts: data.additionalContacts || [],
      isDraft: true,
      updatedAt: new Date(),
    };

    if (data.draftId) {
      // Update existing draft
      await db.collection('report_cards').updateOne(
        { _id: new ObjectId(data.draftId) },
        { $set: draftData }
      );
      
      return NextResponse.json({ 
        success: true, 
        draftId: data.draftId,
        isNew: false
      });
    } else {
      // Create new draft
      const newDraftData = {
        ...draftData,
        createdAt: new Date(),
      };
      const result = await db.collection('report_cards').insertOne(newDraftData);
      
      return NextResponse.json({ 
        success: true, 
        draftId: result.insertedId,
        isNew: true
      });
    }

  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save draft' },
      { status: 500 }
    );
  }
}