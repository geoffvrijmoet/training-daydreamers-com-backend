import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import type { PullOperator } from 'mongodb';

interface DescribedItem {
  id: string;
  title: string;
  description: string;
}

interface CustomCategory {
  id: string;
  name: string;
  items: DescribedItem[];
}

interface UpdateItemRequest {
  id: string;
  title: string;
  description: string;
  category: string;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates: UpdateItemRequest = await request.json();

    const client = await clientPromise;
    const db = client.db();

    // First, try to find which category contains this item
    const settings = await db.collection("settings").findOne({});
    if (!settings) {
      return NextResponse.json(
        { success: false, error: "Settings not found" },
        { status: 404 }
      );
    }

    // Define all possible categories
    const categories = [
      "keyConcepts",
      "productRecommendations",
      "gamesAndActivities",
      "trainingSkills",
      "homework",
      "customCategories"
    ];

    // Find which category contains the item
    let targetCategory = '';
    let targetItem: DescribedItem | null = null;

    for (const category of categories) {
      if (category === 'customCategories') {
        // Handle custom categories differently as they have nested items
        for (const customCat of settings[category] || []) {
          const found = customCat.items?.find((item: DescribedItem) => item.id === id);
          if (found) {
            targetCategory = `customCategories.${customCat.id}.items`;
            targetItem = found;
            break;
          }
        }
      } else {
        const found = settings[category]?.find((item: DescribedItem) => item.id === id);
        if (found) {
          targetCategory = category;
          targetItem = found;
          break;
        }
      }
    }

    if (!targetCategory || !targetItem) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    // Update the item
    const updateQuery = targetCategory.includes('customCategories')
      ? {
          [`${targetCategory}.$[item]`]: {
            ...targetItem,
            ...updates,
            id // Preserve the original ID
          }
        }
      : {
          [`${targetCategory}.$[item]`]: {
            ...targetItem,
            ...updates,
            id // Preserve the original ID
          }
        };

    const result = await db.collection("settings").updateOne(
      {},
      { $set: updateQuery },
      {
        arrayFilters: [{ "item.id": id }]
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to update item" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      updated: {
        ...targetItem,
        ...updates,
        id
      }
    });
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update item" },
      { status: 500 }
    );
  }
} 

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const client = await clientPromise;
    const db = client.db();

    // First, try to find which category contains this item
    const settings = await db.collection("settings").findOne({});
    if (!settings) {
      return NextResponse.json(
        { success: false, error: "Settings not found" },
        { status: 404 }
      );
    }

    // Define all possible categories
    const categories = [
      "keyConcepts",
      "productRecommendations",
      "gamesAndActivities",
      "trainingSkills",
      "homework",
      "customCategories"
    ];

    // Find which category contains the item
    let targetCategory = '';
    let targetItem: DescribedItem | null = null;

    for (const category of categories) {
      if (category === 'customCategories') {
        // Handle custom categories differently as they have nested items
        for (const customCat of settings[category] || []) {
          const found = customCat.items?.find((item: DescribedItem) => item.id === id);
          if (found) {
            targetCategory = `customCategories.${customCat.id}.items`;
            targetItem = found;
            break;
          }
        }
      } else {
        const found = settings[category]?.find((item: DescribedItem) => item.id === id);
        if (found) {
          targetCategory = category;
          targetItem = found;
          break;
        }
      }
    }

    if (!targetCategory || !targetItem) {
      return NextResponse.json(
        { success: false, error: "Item not found" },
        { status: 404 }
      );
    }

    // Delete the item using a simpler approach
    let result;
    
    if (targetCategory.includes('customCategories')) {
      // For custom categories, update the entire settings document
      const updatedSettings = {
        ...settings,
        customCategories: settings.customCategories.map((cat: CustomCategory) => 
          cat.id === targetCategory.split('.')[1] 
            ? { ...cat, items: cat.items.filter((item: DescribedItem) => item.id !== id) }
            : cat
        )
      };
      
      result = await db.collection("settings").updateOne(
        {},
        { $set: updatedSettings }
      );
    } else {
      // For regular categories, use simple $pull
      const deleteQuery = {
        $pull: {
          [targetCategory]: { id }
        }
      } as { $pull: PullOperator<Document> };
      
      result = await db.collection("settings").updateOne(
        {},
        deleteQuery
      );
    }

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to delete item" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      deleted: targetItem
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete item" },
      { status: 500 }
    );
  }
} 