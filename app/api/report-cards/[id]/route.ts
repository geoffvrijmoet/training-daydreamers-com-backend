import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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
        if (item && item._id) {
          optionMap[item._id.toString()] = { title: item.title, description: item.description };
        }
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectedItems = (reportCardRaw.selectedItemGroups || []).map((group: any) => ({
      category: group.category,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (group.items || []).map((it: any) => {
        const base = optionMap[it.itemId.toString()] || { title: 'Unknown', description: '' };
        return {
          title: base.title,
          description: it.customDescription && it.customDescription.length > 0 ? it.customDescription : base.description,
        };
      }),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productRecommendations = (reportCardRaw.productRecommendationIds || []).map((id: any) => optionMap[id.toString()]?.title || 'Unknown');

    const reportCard = {
      ...reportCardRaw,
      selectedItems,
      productRecommendations,
      selectedItemGroupsRaw: reportCardRaw.selectedItemGroups,
    };

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
    const { summary, selectedItemGroups, shortTermGoals } = body;

    const client = await clientPromise;
    const db = client.db('training_daydreamers');

    const { ObjectId } = await import('mongodb');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedGroups = (selectedItemGroups || []).map((group: any) => ({
      category: group.category,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (group.items || []).map((it: any) => ({
        itemId: new ObjectId(it.itemId),
        customDescription: it.customDescription || '',
      })),
    }));

    await db.collection('report_cards').updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
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