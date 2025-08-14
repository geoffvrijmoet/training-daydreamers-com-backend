import { ObjectId } from 'mongodb';

// Helper to determine whether a value can be safely converted to an ObjectId
export function toObjectIdIfValid(id: unknown) {
  if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
    return new ObjectId(id);
  }
  return id;
}

// Transform selected item groups for database storage
export function transformSelectedItemGroups(selectedItemGroups: any[]) {
  return (selectedItemGroups || []).map((group: any) => ({
    category: group.category,
    items: (group.items || []).map((it: any) => ({
      itemId: toObjectIdIfValid(it.itemId),
      customDescription: it.customDescription || '',
    })),
  }));
}

// Transform product recommendation IDs for database storage
export function transformProductRecommendationIds(productRecommendationIds: string[]) {
  return (productRecommendationIds || []).map((id: string) => toObjectIdIfValid(id));
}

// Build option map for frontend consumption
export function buildOptionMap(settings: any) {
  const optionMap: Record<string, { title: string; description: string }> = {};

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
      for (const cat of settings.customCategories) {
        addToMap(cat.items);
      }
    }
  }

  return optionMap;
}

// Transform report card for frontend consumption
export function transformReportCardForFrontend(card: any, optionMap: Record<string, { title: string; description: string }>) {
  const selectedItems = (card.selectedItemGroups || []).map((group: any) => ({
    category: group.category,
    items: (group.items || []).map((it: any) => {
      const key = typeof it.itemId === 'object' && it.itemId?.$oid ? it.itemId.$oid : it.itemId?.toString?.();
      const base = (key && optionMap[key]) || { title: 'Unknown', description: '' };
      return {
        title: base.title,
        description: it.customDescription && it.customDescription.length > 0 ? it.customDescription : base.description,
      };
    }),
  }));

  const productRecommendations = (card.productRecommendationIds || []).map((id: any) => optionMap[id.toString()]?.title || 'Unknown');

  return {
    ...card,
    selectedItems,
    productRecommendations,
  };
}
