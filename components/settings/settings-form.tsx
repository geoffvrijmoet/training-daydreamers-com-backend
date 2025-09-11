"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, LinkIcon, Plus, Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { CategoryBox, COLOR_VARIANTS } from "./category-box";
import { cn } from "@/lib/utils";

interface DescribedItem {
  id: string;
  title: string;
  description: string;
  url?: string;
}

interface Settings {
  keyConcepts: DescribedItem[];
  productRecommendations: DescribedItem[];
  gamesAndActivities: DescribedItem[];
  trainingSkills: DescribedItem[];
  homework: DescribedItem[];
  customCategories: {
    id: string;
    name: string;
    order: number;
    items: DescribedItem[];
  }[];
}

interface ItemDisplayProps {
  item: DescribedItem;
  isEditing?: boolean;
  onEdit: (item: DescribedItem) => void;
  onSave?: (title: string, description: string, url?: string) => void;
  onCancel?: () => void;
  onDelete?: (item: DescribedItem) => void;
  bgClass?: string;
  textClass?: string;
}

function ItemForm({ 
  initialTitle = "", 
  initialDescription = "", 
  initialUrl = "",
  onSubmit, 
  onCancel, 
  submitLabel = "Add",
  placeholder,
  isSaving = false
}: {
  initialTitle?: string;
  initialDescription?: string;
  initialUrl?: string;
  onSubmit: (title: string, description: string, url?: string) => void;
  onCancel: () => void;
  submitLabel?: string;
  placeholder?: string;
  isSaving?: boolean;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [url, setUrl] = useState(initialUrl);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit(title, description, url);
    }} className="space-y-4 border rounded-lg p-4 bg-gray-50">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={placeholder || "Enter title..."}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="url">URL (Optional)</Label>
        <Input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="Add description..."
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : submitLabel}</Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ensureItemHasId(item: Partial<DescribedItem>): DescribedItem {
  return {
    id: item.id || Date.now().toString(),
    title: item.title || '',
    description: item.description || '',
    url: item.url || undefined
  };
}

function ItemDisplay({ 
  item, 
  onEdit,
  isEditing,
  onSave,
  onCancel,
  onDelete,
  bgClass,
  textClass
}: ItemDisplayProps) {
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDescription, setEditDescription] = useState(item.description);

  if (isEditing) {
    return (
      <div className="border rounded-lg p-4 bg-gray-50">
        <form onSubmit={(e) => {
          e.preventDefault();
          onSave?.(editTitle, editDescription);
        }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`title-${item.id}`}>Title</Label>
            <Input
              id={`title-${item.id}`}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`description-${item.id}`}>Description</Label>
            <RichTextEditor
              value={editDescription}
              onChange={setEditDescription}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Save</Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  const wrapperBg = bgClass || "bg-transparent";
  const text = textClass || "text-gray-600";

  // Derive border color: if bgClass like bg-blue-100, use border-blue-700
  let borderColorClass = "border-gray-400";
  const match = wrapperBg.match(/bg-(.+)-100/);
  if (match) {

  } else if (textClass) {
    // fallback to textClass color by replacing text- with border-
    borderColorClass = textClass.replace(/^text-/, "border-");
  }
  return (
    <div className={cn("relative border rounded-lg p-4", wrapperBg, borderColorClass)}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold">
          {item.url ? (
            <a 
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              {item.title}
              <LinkIcon size={14} className="inline-block" />
            </a>
          ) : (
            item.title
          )}
        </h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(item)}
            className="h-8 w-8 p-0"
          >
            <Pencil size={14} />
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
            >
              <Trash size={14} />
            </Button>
          )}
        </div>
      </div>
      <div 
        className={cn(text, "prose prose-sm max-w-none [&_p]:whitespace-pre-wrap [&_p]:mb-4 last:[&_p]:mb-0")}
        dangerouslySetInnerHTML={{ __html: item.description }}
      />
    </div>
  );
}

interface EditingState {
  item: DescribedItem;
  category: keyof Settings;
  categoryId?: string;
}

function ensureItemsHaveIds(items: Partial<DescribedItem>[]): DescribedItem[] {
  return items.map(item => ({
    id: item.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: item.title || '',
    description: item.description || '',
    url: item.url || undefined
  }));
}

export function SettingsForm() {
  const [settings, setSettings] = useState<Settings>({ 
    keyConcepts: [], 
    productRecommendations: [], 
    gamesAndActivities: [], 
    trainingSkills: [], 
    homework: [],
    customCategories: []
  });
  
  // Form visibility state
  const [showConceptForm, setShowConceptForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showGameActivityForm, setShowGameActivityForm] = useState(false);
  const [showTrainingSkillForm, setShowTrainingSkillForm] = useState(false);
  const [showHomeworkForm, setShowHomeworkForm] = useState(false);

  // New item state

  // Editing state
  const [editingItem, setEditingItem] = useState<EditingState | null>(null);

  // Delete confirmation state
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  // For deleting entire custom categories
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justReordered, setJustReordered] = useState<string | null>(null);

  // Add state for new category dialog
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Active expanded category id
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleToggleCategory = (id: string) => {
    setActiveId(prev => (prev === id ? null : id));
  };

  // Temporary function to add IDs to custom categories
  const addIdsToCustomCategories = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const updatedSettings = {
        ...settings,
        customCategories: settings.customCategories.map(cat => ({
          ...cat,
          id: cat.id || Date.now().toString() + Math.random().toString(36).substr(2, 9)
        }))
      };

      await saveSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error adding IDs to custom categories:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };


  // Function to move a category up in order
  const handleMoveCategoryUp = async (categoryId: string) => {
    const sortedCategories = [...settings.customCategories].sort((a, b) => a.order - b.order);
    const currentIndex = sortedCategories.findIndex(cat => cat.id === categoryId);
    
    if (currentIndex <= 0) return; // Already at the top
    
    const targetIndex = currentIndex - 1;
    const currentCategory = sortedCategories[currentIndex];
    const targetCategory = sortedCategories[targetIndex];
    
    // Optimistic update - immediately update UI
    const updatedSettings = {
      ...settings,
      customCategories: settings.customCategories.map(cat => {
        if (cat.id === currentCategory.id) {
          return { ...cat, order: targetCategory.order };
        } else if (cat.id === targetCategory.id) {
          return { ...cat, order: currentCategory.order };
        }
        return cat;
      })
    };

    // Update UI immediately for smooth experience
    setSettings(updatedSettings);
    setIsSaving(true);
    setError(null);

    try {
      await saveSettings(updatedSettings);
      // Show success animation
      setJustReordered(categoryId);
      setTimeout(() => setJustReordered(null), 1000);
    } catch (error) {
      console.error('Error moving category up:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      // Revert optimistic update on error
      setSettings(settings);
    } finally {
      setIsSaving(false);
    }
  };

  // Function to move a category down in order
  const handleMoveCategoryDown = async (categoryId: string) => {
    const sortedCategories = [...settings.customCategories].sort((a, b) => a.order - b.order);
    const currentIndex = sortedCategories.findIndex(cat => cat.id === categoryId);
    
    if (currentIndex >= sortedCategories.length - 1) return; // Already at the bottom
    
    const targetIndex = currentIndex + 1;
    const currentCategory = sortedCategories[currentIndex];
    const targetCategory = sortedCategories[targetIndex];
    
    // Optimistic update - immediately update UI
    const updatedSettings = {
      ...settings,
      customCategories: settings.customCategories.map(cat => {
        if (cat.id === currentCategory.id) {
          return { ...cat, order: targetCategory.order };
        } else if (cat.id === targetCategory.id) {
          return { ...cat, order: currentCategory.order };
        }
        return cat;
      })
    };

    // Update UI immediately for smooth experience
    setSettings(updatedSettings);
    setIsSaving(true);
    setError(null);

    try {
      await saveSettings(updatedSettings);
      // Show success animation
      setJustReordered(categoryId);
      setTimeout(() => setJustReordered(null), 1000);
    } catch (error) {
      console.error('Error moving category down:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      // Revert optimistic update on error
      setSettings(settings);
    } finally {
      setIsSaving(false);
    }
  };

  // Update function to handle new category creation
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSaving(true);

    const newCategory = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: newCategoryName.trim(),
      order: settings.customCategories.length, // Set order to the next available number
      items: []
    };

    try {
      // Create updated settings object
      const updatedSettings = {
        ...settings,
        customCategories: [...settings.customCategories, newCategory]
      };

      // Save to MongoDB
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save new category');
      }

      // Update local state only after successful save
      setSettings(updatedSettings);
      setNewCategoryName('');
      setShowNewCategoryDialog(false);
    } catch (error) {
      console.error('Error saving new category:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Update the handleAddItem function
  const handleAddItem = async (
    category: keyof Settings,
    title: string,
    description: string,
    url?: string
  ) => {
    const newItem = ensureItemHasId({ title, description, url });
    const updatedSettings = {
      ...settings,
      [category]: [newItem, ...settings[category]]
    };
    
    setSettings(updatedSettings);
    await saveSettings(updatedSettings);
  };

  // Update the saveSettings function
  async function saveSettings(newSettings?: Settings) {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings || settings),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  }

  // Update the useEffect that loads settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/settings', {
          cache: 'no-store',
          headers: {
            'Pragma': 'no-cache'
          }
        });
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch settings');
        }

        // Ensure all items have IDs
        const updatedSettings = {
          keyConcepts: ensureItemsHaveIds(data.settings?.keyConcepts || []),
          productRecommendations: ensureItemsHaveIds(data.settings?.productRecommendations || []),
          gamesAndActivities: ensureItemsHaveIds(data.settings?.gamesAndActivities || []),
          trainingSkills: ensureItemsHaveIds(data.settings?.trainingSkills || []),
          homework: ensureItemsHaveIds(data.settings?.homework || []),
          customCategories: (data.settings?.customCategories || []).map((cat: { id: string; name: string; order?: number; items: DescribedItem[] }, index: number) => ({
            ...cat,
            order: cat.order ?? index, // Default to index if no order is set
            items: ensureItemsHaveIds(cat.items)
          }))
        };

        // Check if any custom categories were missing order fields and need to be saved back to DB
        const needsOrderUpdate = (data.settings?.customCategories || []).some((cat: { order?: number }) => cat.order === undefined);
        if (needsOrderUpdate) {
          console.log('Some custom categories were missing order fields, updating database...');
          try {
            await saveSettings(updatedSettings);
            console.log('Successfully updated custom categories with order fields');
          } catch (error) {
            console.error('Error updating custom categories with order fields:', error);
            // Don't throw here - we still want to show the settings even if the update fails
          }
        }

        // Only update MongoDB if there are missing items or actual data changes
        const hasActualChanges = !data.settings || Object.keys(updatedSettings).some(key => {
          const settingsKey = key as keyof Settings;
          const originalItems = data.settings[settingsKey] || [];
          const updatedItems = updatedSettings[settingsKey];
          
          // Compare lengths
          if (originalItems.length !== updatedItems.length) return true;
          
          // Handle both regular items and custom categories
          const isCustomCategories = settingsKey === 'customCategories';
          const compareItems = isCustomCategories 
            ? (originalItems as { items: DescribedItem[] }[]).map(cat => cat.items).flat()
            : (originalItems as DescribedItem[]);
          const compareUpdated = isCustomCategories
            ? (updatedItems as { items: DescribedItem[] }[]).map(cat => cat.items).flat()
            : (updatedItems as DescribedItem[]);
          
          return JSON.stringify(compareItems.map((item) => ({ 
            title: item.title, 
            description: item.description,
            url: item.url
          }))) !== JSON.stringify(compareUpdated.map((item) => ({
            title: item.title,
            description: item.description,
            url: item.url
          })));
        });

        if (hasActualChanges) {
          await fetch('/api/settings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Pragma': 'no-cache'
            },
            body: JSON.stringify(updatedSettings),
          });
        }

        setSettings(updatedSettings);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  async function deleteItem(itemId: string) {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/settings/items/${itemId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete item');
      }

      // Update local state by removing the item from all categories
      setSettings(prev => ({
        ...prev,
        keyConcepts: prev.keyConcepts.filter(item => item.id !== itemId),
        productRecommendations: prev.productRecommendations.filter(item => item.id !== itemId),
        gamesAndActivities: prev.gamesAndActivities.filter(item => item.id !== itemId),
        trainingSkills: prev.trainingSkills.filter(item => item.id !== itemId),
        homework: prev.homework.filter(item => item.id !== itemId),
        customCategories: prev.customCategories.map(cat => ({
          ...cat,
          items: cat.items.filter(item => item.id !== itemId)
        }))
      }));
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSaving(false);
      setItemToDelete(null);
    }
  }

  async function deleteCategory(identifier: string) {
    setIsSaving(true);
    setError(null);

    try {
      const updatedSettings = {
        ...settings,
        customCategories: settings.customCategories.filter(cat => {
          if (cat.id) {
            return cat.id !== identifier;
          }
          return cat.name !== identifier; // Fallback when id is missing
        }),
      };

      await saveSettings(updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error deleting category:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSaving(false);
      setCategoryToDelete(null);
    }
  }

  // Update the handleEditClick function
  const handleEditClick = (item: DescribedItem, category: keyof Settings) => {
    setEditingItem({ item, category });
    // Show the ItemForm for editing
    switch (category) {
      case 'keyConcepts':
        setShowConceptForm(true);
        break;
      case 'gamesAndActivities':
        setShowGameActivityForm(true);
        break;
      case 'productRecommendations':
        setShowProductForm(true);
        break;
      case 'trainingSkills':
        setShowTrainingSkillForm(true);
        break;
      case 'homework':
        setShowHomeworkForm(true);
        break;
    }
  };

  const handleEditItem = async (item: DescribedItem, category: keyof Settings) => {
    try {
      const response = await fetch(`/api/settings/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...item,
          category // Include category in the update
        }),
      });

      if (!response.ok) throw new Error('Failed to update item');

      // Update local state
      setSettings(prev => ({
        ...prev,
        [category]: prev[category].map(i => i.id === item.id ? item : i)
      }));

      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <section>
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-2xl font-semibold">Report Card Elements</h2>
          <Button 
            onClick={() => setShowNewCategoryDialog(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Plus size={16} />
            Add New Element
          </Button>
        </div>
        
        <div className="flex flex-col gap-4">
          {/* Report Card Elements List */}
          <CategoryBox
            staggerIndex={0}
            id="keyConcepts"
            title="Key Concepts"
            items={settings.keyConcepts}
            onAddNew={() => {
              setEditingItem(null);
              setShowConceptForm(true);
            }}
            colorIndex={0}
            isExpanded={activeId === 'keyConcepts'}
            onToggle={() => handleToggleCategory('keyConcepts')}
            dimmed={activeId !== null && activeId !== 'keyConcepts'}
          >
            {/* Show the add form at the top only when adding a new item */}
            {showConceptForm && !editingItem && (
              <ItemForm
                initialTitle=""
                initialDescription=""
                initialUrl=""
                onSubmit={async (title, description, url) => {
                  await handleAddItem('keyConcepts', title, description, url);
                  setShowConceptForm(false);
                }}
                onCancel={() => {
                  setShowConceptForm(false);
                  setEditingItem(null);
                }}
                submitLabel="Add"
                placeholder="e.g., Trigger Stacking"
                isSaving={isSaving}
              />
            )}
            
            <div className="space-y-4">
              {settings.keyConcepts.map((item) => (
                <div key={item.id}>
                  {editingItem?.item.id === item.id ? (
                    <ItemForm
                      initialTitle={item.title}
                      initialDescription={item.description}
                      initialUrl={item.url || ""}
                      onSubmit={async (title, description, url) => {
                        const updatedItem = {
                          ...item,
                          title,
                          description,
                          url
                        };
                        await handleEditItem(updatedItem, 'keyConcepts');
                        setShowConceptForm(false);
                        setEditingItem(null);
                      }}
                      onCancel={() => {
                        setShowConceptForm(false);
                        setEditingItem(null);
                      }}
                      submitLabel="Save"
                      placeholder="e.g., Trigger Stacking"
                      isSaving={isSaving}
                    />
                  ) : (
                    <ItemDisplay
                      item={item}
                      onEdit={(item) => handleEditClick(item, 'keyConcepts')}
                      onDelete={async (item) => {
                        setItemToDelete(item.id);
                      }}
                      bgClass={COLOR_VARIANTS[0].bg}
                      textClass={COLOR_VARIANTS[0].text}
                    />
                  )}
                </div>
              ))}
            </div>
          </CategoryBox>

          <CategoryBox 
            staggerIndex={1}
            id="gamesActivities"
            title="Games & Activities" 
            items={settings.gamesAndActivities}
            onAddNew={() => {
              setEditingItem(null);
              setShowGameActivityForm(true);
            }}
            colorIndex={1}
            isExpanded={activeId === 'gamesActivities'}
            onToggle={() => handleToggleCategory('gamesActivities')}
            dimmed={activeId !== null && activeId !== 'gamesActivities'}
          >
            {showGameActivityForm && (
              <ItemForm
                initialTitle={editingItem?.item.title || ""}
                initialDescription={editingItem?.item.description || ""}
                initialUrl={editingItem?.item.url || ""}
                onSubmit={async (title, description, url) => {
                  if (editingItem) {
                    const updatedItem = {
                      ...editingItem.item,
                      title,
                      description,
                      url: url || undefined
                    };
                    await handleEditItem(updatedItem, 'gamesAndActivities');
                    setShowGameActivityForm(false);
                    setEditingItem(null);
                  } else {
                    await handleAddItem('gamesAndActivities', title, description, url);
                    setShowGameActivityForm(false);
                  }
                }}
                onCancel={() => {
                  setShowGameActivityForm(false);
                  setEditingItem(null);
                }}
                submitLabel={editingItem ? "Save" : "Add"}
                placeholder="e.g., Find It Game"
                isSaving={isSaving}
              />
            )}
            
            <div className="space-y-4">
              {settings.gamesAndActivities.map((item) => (
                <ItemDisplay
                  key={item.id}
                  item={item}
                  isEditing={editingItem?.item.id === item.id}
                  onEdit={(item) => {
                    setEditingItem({ item, category: 'gamesAndActivities' });
                  }}
                  onSave={async (title, description, url) => {
                    const updatedItem = {
                      ...editingItem!.item,
                      title,
                      description,
                      url: url || undefined
                    };
                    await handleEditItem(updatedItem, 'gamesAndActivities');
                    setEditingItem(null);
                  }}
                  onCancel={() => {
                    setEditingItem(null);
                  }}
                  onDelete={async (item) => {
                    setItemToDelete(item.id);
                  }}
                  bgClass={COLOR_VARIANTS[1].bg}
                  textClass={COLOR_VARIANTS[1].text}
                />
              ))}
            </div>
          </CategoryBox>

          <CategoryBox 
            staggerIndex={2}
            id="productRecommendations"
            title="Product Recommendations" 
            items={settings.productRecommendations}
            onAddNew={() => {
              setEditingItem(null);
              setShowProductForm(true);
            }}
            colorIndex={2}
            isExpanded={activeId === 'productRecommendations'}
            onToggle={() => handleToggleCategory('productRecommendations')}
            dimmed={activeId !== null && activeId !== 'productRecommendations'}
          >
            {showProductForm && (
              <ItemForm
                initialTitle={editingItem?.item.title || ""}
                initialDescription={editingItem?.item.description || ""}
                initialUrl={editingItem?.item.url || ""}
                onSubmit={async (title, description, url) => {
                  if (editingItem) {
                    const updatedItem = {
                      ...editingItem.item,
                      title,
                      description,
                      url
                    };
                    await handleEditItem(updatedItem, 'productRecommendations');
                    setShowProductForm(false);
                    setEditingItem(null);
                  } else {
                    await handleAddItem('productRecommendations', title, description, url);
                    setShowProductForm(false);
                  }
                }}
                onCancel={() => {
                  setShowProductForm(false);
                  setEditingItem(null);
                }}
                submitLabel={editingItem ? "Save" : "Add"}
                placeholder="e.g., Product Name"
                isSaving={isSaving}
              />
            )}
            
            <div className="space-y-4">
              {settings.productRecommendations.map((item) => (
                <ItemDisplay
                  key={item.id}
                  item={item}
                  isEditing={editingItem?.item.id === item.id}
                  onEdit={(item) => {
                    setEditingItem({ item, category: 'productRecommendations' });
                  }}
                  onSave={async (title, description, url) => {
                    const updatedItem = {
                      ...editingItem!.item,
                      title,
                      description,
                      url
                    };
                    await handleEditItem(updatedItem, 'productRecommendations');
                    setEditingItem(null);
                  }}
                  onCancel={() => {
                    setEditingItem(null);
                  }}
                  onDelete={async (item) => {
                    setItemToDelete(item.id);
                  }}
                  bgClass={COLOR_VARIANTS[2].bg}
                  textClass={COLOR_VARIANTS[2].text}
                />
              ))}
            </div>
          </CategoryBox>

          <CategoryBox 
            staggerIndex={3}
            id="trainingSkills"
            title="Training Skills" 
            items={settings.trainingSkills}
            onAddNew={() => {
              setEditingItem(null);
              setShowTrainingSkillForm(true);
            }}
            colorIndex={3}
            isExpanded={activeId === 'trainingSkills'}
            onToggle={() => handleToggleCategory('trainingSkills')}
            dimmed={activeId !== null && activeId !== 'trainingSkills'}
          >
            {showTrainingSkillForm && (
              <ItemForm
                initialTitle={editingItem?.item.title || ""}
                initialDescription={editingItem?.item.description || ""}
                initialUrl={editingItem?.item.url || ""}
                onSubmit={async (title, description, url) => {
                  if (editingItem) {
                    const updatedItem = {
                      ...editingItem.item,
                      title,
                      description,
                      url
                    };
                    await handleEditItem(updatedItem, 'trainingSkills');
                    setShowTrainingSkillForm(false);
                    setEditingItem(null);
                  } else {
                    await handleAddItem('trainingSkills', title, description, url);
                    setShowTrainingSkillForm(false);
                  }
                }}
                onCancel={() => {
                  setShowTrainingSkillForm(false);
                  setEditingItem(null);
                }}
                submitLabel={editingItem ? "Save" : "Add"}
                placeholder="e.g., Skill Name"
                isSaving={isSaving}
              />
            )}
            
            <div className="space-y-4">
              {settings.trainingSkills.map((item) => (
                <ItemDisplay
                  key={item.id}
                  item={item}
                  isEditing={editingItem?.item.id === item.id}
                  onEdit={(item) => {
                    setEditingItem({ item, category: 'trainingSkills' });
                  }}
                  onSave={async (title, description, url) => {
                    const updatedItem = {
                      ...editingItem!.item,
                      title,
                      description,
                      url
                    };
                    await handleEditItem(updatedItem, 'trainingSkills');
                    setEditingItem(null);
                  }}
                  onCancel={() => {
                    setEditingItem(null);
                  }}
                  onDelete={async (item) => {
                    setItemToDelete(item.id);
                  }}
                  bgClass={COLOR_VARIANTS[3].bg}
                  textClass={COLOR_VARIANTS[3].text}
                />
              ))}
            </div>
          </CategoryBox>

          <CategoryBox 
            staggerIndex={4}
            id="homework"
            title="Homework" 
            items={settings.homework}
            onAddNew={() => {
              setEditingItem(null);
              setShowHomeworkForm(true);
            }}
            colorIndex={4}
            isExpanded={activeId === 'homework'}
            onToggle={() => handleToggleCategory('homework')}
            dimmed={activeId !== null && activeId !== 'homework'}
          >
            {showHomeworkForm && (
              <ItemForm
                initialTitle={editingItem?.item.title || ""}
                initialDescription={editingItem?.item.description || ""}
                initialUrl={editingItem?.item.url || ""}
                onSubmit={async (title, description, url) => {
                  if (editingItem) {
                    const updatedItem = {
                      ...editingItem.item,
                      title,
                      description,
                      url
                    };
                    await handleEditItem(updatedItem, 'homework');
                    setShowHomeworkForm(false);
                    setEditingItem(null);
                  } else {
                    await handleAddItem('homework', title, description, url);
                    setShowHomeworkForm(false);
                  }
                }}
                onCancel={() => {
                  setShowHomeworkForm(false);
                  setEditingItem(null);
                }}
                submitLabel={editingItem ? "Save" : "Add"}
                placeholder="e.g., Homework Title"
                isSaving={isSaving}
              />
            )}
            
            <div className="space-y-4">
              {settings.homework.map((item) => (
                <ItemDisplay
                  key={item.id}
                  item={item}
                  isEditing={editingItem?.item.id === item.id}
                  onEdit={(item) => {
                    setEditingItem({ item, category: 'homework' });
                  }}
                  onSave={async (title, description, url) => {
                    const updatedItem = {
                      ...editingItem!.item,
                      title,
                      description,
                      url
                    };
                    await handleEditItem(updatedItem, 'homework');
                    setEditingItem(null);
                  }}
                  onCancel={() => {
                    setEditingItem(null);
                  }}
                  onDelete={async (item) => {
                    setItemToDelete(item.id);
                  }}
                  bgClass={COLOR_VARIANTS[4].bg}
                  textClass={COLOR_VARIANTS[4].text}
                />
              ))}
            </div>
          </CategoryBox>

          {/* Custom categories */}
          {settings.customCategories
            .sort((a, b) => a.order - b.order)
            .map((category, index) => {
              const sortedCategories = [...settings.customCategories].sort((a, b) => a.order - b.order);
              const currentIndex = sortedCategories.findIndex(cat => cat.id === category.id);
              const canMoveUp = currentIndex > 0;
              const canMoveDown = currentIndex < sortedCategories.length - 1;
              
              return (
            <CategoryBox
              key={category.id}
              staggerIndex={5 + index}
              id={category.id}
              title={category.name}
              items={category.items}
              showOrderControls={true}
              onMoveUp={() => handleMoveCategoryUp(category.id)}
              onMoveDown={() => handleMoveCategoryDown(category.id)}
              canMoveUp={canMoveUp && !isSaving}
              canMoveDown={canMoveDown && !isSaving}
              isReordering={isSaving}
              justReordered={justReordered === category.id}
              onAddNew={() => {
                // Create a new item in this specific custom category
                const newItem = ensureItemHasId({
                  title: '',
                  description: '',
                });
                
                const updatedSettings = {
                  ...settings,
                  customCategories: settings.customCategories.map(cat => 
                    cat.id === category.id 
                      ? { ...cat, items: [newItem, ...cat.items] }
                      : cat
                  )
                };
                
                setSettings(updatedSettings);
                setEditingItem({ 
                  item: newItem, 
                  category: 'customCategories',
                  categoryId: category.id 
                });
              }}
              onDelete={() => setCategoryToDelete({ id: category.id || category.name, name: category.name })}
              colorIndex={5 + index}
              isExpanded={activeId === category.id}
              onToggle={() => handleToggleCategory(category.id)}
              dimmed={activeId !== null && activeId !== category.id}
            >
              <div className="space-y-4">
                {category.items.map((item) => (
                  <ItemDisplay
                    key={`${category.id}-${item.id}`}
                    item={item}
                    isEditing={editingItem?.item.id === item.id}
                    onEdit={(item) => {
                      setEditingItem({ 
                        item, 
                        category: 'customCategories',
                        categoryId: category.id 
                      });
                    }}
                    onSave={async (title, description, url) => {
                      const updatedItem = {
                        ...editingItem!.item,
                        title,
                        description,
                        url
                      };
                      
                      const updatedSettings = {
                        ...settings,
                        customCategories: settings.customCategories.map(cat =>
                          cat.id === category.id
                            ? {
                                ...cat,
                                items: cat.items.map(i =>
                                  i.id === updatedItem.id ? updatedItem : i
                                )
                              }
                            : cat
                        )
                      };
                      
                      await saveSettings(updatedSettings);
                      setSettings(updatedSettings);
                      setEditingItem(null);
                    }}
                    onCancel={() => setEditingItem(null)}
                    onDelete={async (item) => {
                      setItemToDelete(item.id);
                    }}
                    bgClass={COLOR_VARIANTS[(5+index)%COLOR_VARIANTS.length].bg}
                    textClass={COLOR_VARIANTS[(5+index)%COLOR_VARIANTS.length].text}
                  />
                ))}
                
                {/* Show form for adding/editing items in custom category */}
                {editingItem?.categoryId === category.id && editingItem?.item && (
                  <ItemForm
                    initialTitle={editingItem.item.title}
                    initialDescription={editingItem.item.description}
                    initialUrl={editingItem.item.url}
                    onSubmit={async (title, description, url) => {
                      const updatedItem = {
                        ...editingItem.item,
                        title,
                        description,
                        url
                      };
                      
                      const updatedSettings = {
                        ...settings,
                        customCategories: settings.customCategories.map(cat =>
                          cat.id === category.id
                            ? {
                                ...cat,
                                items: cat.items.map(i =>
                                  i.id === updatedItem.id ? updatedItem : i
                                )
                              }
                            : cat
                        )
                      };
                      
                      await saveSettings(updatedSettings);
                      setSettings(updatedSettings);
                      setEditingItem(null);
                    }}
                    onCancel={() => setEditingItem(null)}
                    submitLabel="Save"
                    isSaving={isSaving}
                  />
                )}
              </div>
            </CategoryBox>
              );
            })}
        </div>
      </section>

      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this item. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && deleteItem(itemToDelete)}
              className="bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm deletion of a custom category */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{categoryToDelete?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the entire element and all of its items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => categoryToDelete && deleteCategory(categoryToDelete.id)}
              className="bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for adding new category */}
      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Element</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Element Name</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Training Equipment"
              />
            </div>
            <Button
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim()}
            >
              Add Element
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 