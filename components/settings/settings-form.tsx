"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Link as LinkIcon, Plus } from "lucide-react";
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
import { CategoryBox } from "./category-box";

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
    items: DescribedItem[];
  }[];
}

interface ItemDisplayProps {
  item: DescribedItem;
  isEditing?: boolean;
  onEdit: (item: DescribedItem) => void;
  onSave?: (title: string, description: string, url?: string) => void;
  onCancel?: () => void;
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
  onCancel
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

  return (
    <div className="relative border rounded-lg p-4 bg-white">
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(item)}
          className="h-8 w-8 p-0"
        >
          <Pencil size={14} />
        </Button>
      </div>
      <div 
        className="text-gray-600 prose prose-sm max-w-none [&_p]:whitespace-pre-wrap [&_p]:mb-4 last:[&_p]:mb-0"
        dangerouslySetInnerHTML={{ __html: item.description }}
      />
    </div>
  );
}

interface EditingState {
  item: DescribedItem;
  category: keyof Settings;
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
  const [conceptToDelete, setConceptToDelete] = useState<string | null>(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add state for new category dialog
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Add function to handle new category creation
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;

    const newCategory = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      items: []
    };

    setSettings(prev => ({
      ...prev,
      customCategories: [...prev.customCategories, newCategory]
    }));

    setNewCategoryName('');
    setShowNewCategoryDialog(false);
    saveSettings({
      ...settings,
      customCategories: [...settings.customCategories, newCategory]
    });
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
        const response = await fetch('/api/settings');
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
          customCategories: (data.settings?.customCategories || []).map((cat: { id: string; name: string; items: DescribedItem[] }) => ({
            ...cat,
            items: ensureItemsHaveIds(cat.items)
          }))
        };

        // Check if any IDs were added and update MongoDB if needed
        const hasNewIds = JSON.stringify(data.settings) !== JSON.stringify(updatedSettings);
        if (hasNewIds) {
          await fetch('/api/settings', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
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

  async function deleteKeyConcept(title: string) {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/settings/key-concepts/${encodeURIComponent(title)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete concept');
      }

      setSettings(prev => ({
        ...prev,
        keyConcepts: prev.keyConcepts.filter(c => c.title !== title)
      }));
    } catch (error) {
      console.error('Error deleting concept:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSaving(false);
      setConceptToDelete(null);
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          <CategoryBox 
            title="Key Concepts" 
            items={settings.keyConcepts}
            onAddNew={() => {
              setEditingItem(null);
              setShowConceptForm(true);
            }}
          >
            {showConceptForm && (
              <ItemForm
                initialTitle={editingItem?.item.title || ""}
                initialDescription={editingItem?.item.description || ""}
                initialUrl={editingItem?.item.url || ""}
                onSubmit={async (title, description, url) => {
                  if (editingItem) {
                    // Handle edit
                    const updatedItem = {
                      ...editingItem.item,
                      title,
                      description,
                      url
                    };
                    await handleEditItem(updatedItem, 'keyConcepts');
                  } else {
                    // Handle new item
                    await handleAddItem('keyConcepts', title, description, url);
                  }
                  setShowConceptForm(false);
                }}
                onCancel={() => {
                  setShowConceptForm(false);
                  setEditingItem(null);
                }}
                submitLabel={editingItem ? "Save" : "Add"}
                placeholder="e.g., Trigger Stacking"
                isSaving={isSaving}
              />
            )}
            
            <div className="space-y-4">
              {settings.keyConcepts.map((item) => (
                <ItemDisplay
                  key={item.id}
                  item={item}
                  onEdit={(item) => handleEditClick(item, 'keyConcepts')}
                />
              ))}
            </div>
          </CategoryBox>

          <CategoryBox 
            title="Games & Activities" 
            items={settings.gamesAndActivities}
            onAddNew={() => {
              setEditingItem(null);
              setShowGameActivityForm(true);
            }}
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
                />
              ))}
            </div>
          </CategoryBox>

          <CategoryBox 
            title="Product Recommendations" 
            items={settings.productRecommendations}
            onAddNew={() => {
              setEditingItem(null);
              setShowProductForm(true);
            }}
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
                />
              ))}
            </div>
          </CategoryBox>

          <CategoryBox 
            title="Training Skills" 
            items={settings.trainingSkills}
            onAddNew={() => {
              setEditingItem(null);
              setShowTrainingSkillForm(true);
            }}
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
                />
              ))}
            </div>
          </CategoryBox>

          <CategoryBox 
            title="Homework" 
            items={settings.homework}
            onAddNew={() => {
              setEditingItem(null);
              setShowHomeworkForm(true);
            }}
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
                />
              ))}
            </div>
          </CategoryBox>

          {/* Custom categories */}
          {settings.customCategories.map(category => (
            <CategoryBox
              key={category.id}
              title={category.name}
              items={category.items}
              onAddNew={() => {
                setEditingItem(null);
                setShowProductForm(true);
              }}
            >
              <div className="space-y-4">
                {category.items.map((item) => (
                  <ItemDisplay
                    key={item.id}
                    item={item}
                    onEdit={item => handleEditClick(item, 'customCategories')}
                  />
                ))}
              </div>
            </CategoryBox>
          ))}
        </div>
      </section>

      <AlertDialog open={!!conceptToDelete} onOpenChange={() => setConceptToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the key concept. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => conceptToDelete && deleteKeyConcept(conceptToDelete)}
              className="bg-red-500 hover:bg-red-600"
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