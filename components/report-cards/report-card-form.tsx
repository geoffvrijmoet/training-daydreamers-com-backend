/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReportCardPreview } from "./report-card-preview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface Client {
  _id: string;
  name: string;
  dogName: string;
  additionalContacts?: Array<{
    name: string;
    email?: string;
    phone?: string;
  }>;
}

interface KeyConcept {
  id?: string;
  title: string;
  description: string;
  url?: string;
  category?: string;
}

interface ShortTermGoal {
  title: string;
  description: string;
}

interface DescribedItem {
  id?: string;
  title: string;
  description: string;
  url?: string;
}

// Utility: get a Date object representing now in Eastern Time, shifted by `daysAgo`
function getEasternDate(daysAgo = 0): Date {
  // Current time in UTC
  const nowUTC = new Date();
  // Convert to Eastern time using locale string trick
  const easternNow = new Date(
    nowUTC.toLocaleString('en-US', { timeZone: 'America/New_York' })
  );
  // Move backward if needed
  easternNow.setDate(easternNow.getDate() - daysAgo);
  return easternNow;
}

// Returns a YYYY-MM-DD string representing the date in Eastern Time
function getDateString(daysAgo: number): string {
  const easternDate = getEasternDate(daysAgo);
  const year = easternDate.getFullYear();
  const month = String(easternDate.getMonth() + 1).padStart(2, '0');
  const day = String(easternDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Converts a YYYY-MM-DD string to { dayOfWeek, mm/dd } in Eastern Time
function formatDisplayDate(dateString: string): { dayOfWeek: string; date: string } {
  const [year, month, day] = dateString.split('-').map(Number);
  // Use noon UTC to avoid DST edge cases, then convert to Eastern
  const dateUTCNoon = new Date(Date.UTC(year, month - 1, day, 12));
  const easternDate = new Date(
    dateUTCNoon.toLocaleString('en-US', { timeZone: 'America/New_York' })
  );

  const displayMonth = String(easternDate.getMonth() + 1).padStart(2, '0');
  const displayDay = String(easternDate.getDate()).padStart(2, '0');
  const dayOfWeek = easternDate.toLocaleString('en-US', {
    weekday: 'short',
    timeZone: 'America/New_York',
  });

  return {
    dayOfWeek,
    date: `${displayMonth}/${displayDay}`,
  };
}

export function ReportCardForm() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productRecommendations, setProductRecommendations] = useState<DescribedItem[]>([]);
  const [shortTermGoals, setShortTermGoals] = useState<ShortTermGoal[]>([]);
  const [shortTermGoalTitle, setShortTermGoalTitle] = useState("");
  const [shortTermGoalDescription, setShortTermGoalDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyConceptOptions, setKeyConceptOptions] = useState<KeyConcept[]>([]);
  const [gamesAndActivitiesOptions, setGamesAndActivitiesOptions] = useState<KeyConcept[]>([]);
  const [trainingSkillsOptions, setTrainingSkillsOptions] = useState<KeyConcept[]>([]);
  const [homeworkOptions, setHomeworkOptions] = useState<KeyConcept[]>([]);
  const [customCategoryOptions, setCustomCategoryOptions] = useState<{
    id: string;
    name: string;
    items: KeyConcept[];
  }[]>([]);
  const [selectedDate, setSelectedDate] = useState(getDateString(0));
  const [summary, setSummary] = useState("");
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [selectedItems, setSelectedItems] = useState<{
    category: string;
    items: KeyConcept[];
  }[]>([]);
  const [editing, setEditing] = useState<{group: string; itemTitle: string; description: string} | null>(null);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    async function fetchClients() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/clients', {
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch clients');
        }

        setClients(data.clients);
      } catch (error) {
        console.error('Error fetching clients:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000));
          await fetchClients();
        } else {
          setError(error instanceof Error ? error.message : 'An error occurred loading clients');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchClients();
  }, []);

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
        
        if (data.success) {
          setKeyConceptOptions(data.settings.keyConcepts || []);
          setGamesAndActivitiesOptions(data.settings.gamesAndActivities || []);
          setTrainingSkillsOptions(data.settings.trainingSkills || []);
          setHomeworkOptions(data.settings.homework || []);
          setCustomCategoryOptions(data.settings.customCategories || []);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    }
    
    fetchSettings();
  }, []);

  useEffect(() => {
    async function fetchProductRecommendations() {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        
        if (data.success && data.settings?.productRecommendations) {
          setProductRecommendations(data.settings.productRecommendations);
        }
      } catch (error) {
        console.error('Error fetching product recommendations:', error);
      }
    }
    
    fetchProductRecommendations();
  }, []);

  // Helper: is a given title currently selected?
  const isItemSelected = (title: string) =>
    selectedItems.flatMap(g => g.items).some(i => i.title === title);

  // Map a category to highlight classes
  const getHighlightClasses = (category: string) => {
    switch (category) {
      case 'Key Concepts':
        return 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-700 hover:text-purple-100';
      case 'Games & Activities':
        return 'bg-green-100 text-green-700 border-green-300 hover:bg-green-700 hover:text-green-100';
      case 'Training Skills':
        return 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-700 hover:text-blue-100';
      case 'Homework':
        return 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-700 hover:text-amber-100';
      default:
        return 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-700 hover:text-orange-100';
    }
  };

  const handleItemSelect = (item: KeyConcept, category: string) => {
    let didAdd = false;
    setSelectedItems(prev => {
      const exists = prev.some(g => g.items.some(i => i.title === item.title));

      if (exists) {
        // Remove item (toggle off)
        return prev
          .map(g => ({
            ...g,
            items: g.items.filter(i => i.title !== item.title),
          }))
          .filter(g => g.items.length > 0);
      }

      // Add item (toggle on)
      const categoryGroup = prev.find(g => g.category === category);
      if (!categoryGroup) {
        didAdd = true;
        return [...prev, { category, items: [{ ...item, category, description: item.description }] }];
      }

      didAdd = true;
      return prev.map(g =>
        g.category === category
          ? { ...g, items: [...g.items, { ...item, category, description: item.description }] }
          : g,
      );
    });

    // After state updates, scroll the preview containers smoothly to bottom
    if (didAdd) {
      setTimeout(() => {
        document.querySelectorAll('[data-preview-container]')
          .forEach((el) => {
            (el as HTMLElement).scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
          });
      }, 100);
    }
  };

  const handleItemRemove = (item: KeyConcept) => {
    setSelectedItems(prev => 
      prev.map(g => ({
        ...g,
        items: g.items.filter(i => i.title !== item.title)
      })).filter(g => g.items.length > 0)
    );
  };

  const handleAddShortTermGoal = () => {
    if (shortTermGoalTitle && shortTermGoalDescription) {
      setShortTermGoals(prev => [...prev, {
        title: shortTermGoalTitle,
        description: shortTermGoalDescription
      }]);
      setShortTermGoalTitle("");
      setShortTermGoalDescription("");
    }
  };

  const handleRemoveShortTermGoal = (index: number) => {
    setShortTermGoals(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveEdit = (category: string, itemTitle: string, newDesc: string) => {
    setSelectedItems(prev => prev.map(group => {
      if (group.category !== category) return group;
      return {
        ...group,
        items: group.items.map(it => it.title === itemTitle ? { ...it, description: newDesc } : it)
      };
    }));
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const client = clients.find(c => c._id === selectedClient);
    if (!client) {
      setError('Please select a client');
      setIsSaving(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const selectedItemGroups = selectedItems.map(group => ({
      category: group.category,
      items: group.items.map((item: any) => ({
        itemId: item.id || (typeof item._id === 'object' && (item._id.$oid || (item._id.toString?.()))) || '',
        customDescription: item.description,
      })),
    }));

    const productRecommendationIds = selectedProducts.map((title) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prod: any = productRecommendations.find((p: any) => p.title === title);
      return prod?.id || (typeof prod?._id === 'object' && (prod?._id.$oid || (prod?._id.toString?.()))) || undefined;
    }).filter(Boolean);

    const data = {
      clientId: selectedClient,
      date: selectedDate,
      summary: formData.get("summary"),
      selectedItemGroups,
      productRecommendationIds,
      shortTermGoals,
      clientName: client.name,
      dogName: client.dogName,
      additionalContacts: client.additionalContacts || [],
    };

    try {
      const response = await fetch('/api/report-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create report card');
      }

      router.push(`/report-cards/${result.reportCardId}`);
    } catch (error) {
      console.error('Error creating report card:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  }

  const selectedClientDetails = clients.find(c => c._id === selectedClient);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      {/* Mobile Tabs */}
      <div className="md:hidden mb-4">
        <div className="flex border-b">
          <button
            className={`flex-1 py-2 px-4 text-center ${
              activeTab === 'edit'
                ? 'border-b-2 border-primary font-semibold'
                : 'text-muted-foreground'
            }`}
            onClick={() => setActiveTab('edit')}
          >
            Edit
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center ${
              activeTab === 'preview'
                ? 'border-b-2 border-primary font-semibold'
                : 'text-muted-foreground'
            }`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Form */}
        <form 
          onSubmit={onSubmit} 
          className={`space-y-6 w-full max-w-2xl ${
            activeTab === 'edit' ? 'block' : 'hidden md:block'
          }`}
        >
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select
              value={selectedClient}
              onValueChange={setSelectedClient}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client._id} value={client._id}>
                    {client.dogName} - {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Session Date</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={selectedDate === getDateString(2) ? "default" : "outline"}
                onClick={() => setSelectedDate(getDateString(2))}
              >
                2d ago
              </Button>
              <Button
                type="button"
                variant={selectedDate === getDateString(1) ? "default" : "outline"}
                onClick={() => setSelectedDate(getDateString(1))}
              >
                1d ago
              </Button>
              <Button
                type="button"
                variant={selectedDate === getDateString(0) ? "default" : "outline"}
                onClick={() => setSelectedDate(getDateString(0))}
              >
                Today
              </Button>
              <div className="relative flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => {
                    const input = document.getElementById('date') as HTMLInputElement;
                    input.showPicker();
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                  >
                    <path
                      d="M4.5 1C4.77614 1 5 1.22386 5 1.5V2H10V1.5C10 1.22386 10.2239 1 10.5 1C10.7761 1 11 1.22386 11 1.5V2H12.5C13.3284 2 14 2.67157 14 3.5V12.5C14 13.3284 13.3284 14 12.5 14H2.5C1.67157 14 1 13.3284 1 12.5V3.5C1 2.67157 1.67157 2 2.5 2H4V1.5C4 1.22386 4.22386 1 4.5 1ZM10 3V3.5C10 3.77614 10.2239 4 10.5 4C10.7761 4 11 3.77614 11 3.5V3H12.5C12.7761 3 13 3.22386 13 3.5V5H2V3.5C2 3.22386 2.22386 3 2.5 3H4V3.5C4 3.77614 4.22386 4 4.5 4C4.77614 4 5 3.77614 5 3.5V3H10ZM2 6V12.5C2 12.7761 2.22386 13 2.5 13H12.5C12.7761 13 13 12.7761 13 12.5V6H2Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
                <div className="flex flex-col items-center text-sm">
                  <span className="text-muted-foreground">{formatDisplayDate(selectedDate).dayOfWeek}</span>
                  <span>{formatDisplayDate(selectedDate).date}</span>
                </div>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="sr-only"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Session Summary</Label>
            <Textarea
              id="summary"
              name="summary"
              required
              className="h-32"
              placeholder="Describe what was covered in the session..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Key Concepts</Label>
            <div className="flex flex-wrap gap-2">
              {keyConceptOptions.map((concept) => {
                const selected = isItemSelected(concept.title);
                return (
                  <Button
                    key={concept.id || concept.title}
                    type="button"
                    variant="outline"
                    className={selected ? getHighlightClasses('Key Concepts') : ''}
                    onClick={() => handleItemSelect(concept, 'Key Concepts')}
                    title={concept.description}
                  >
                    {concept.title}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Games & Activities</Label>
            <div className="flex flex-wrap gap-2">
              {gamesAndActivitiesOptions.map((activity) => {
                const selected = isItemSelected(activity.title);
                return (
                  <Button
                    key={activity.id || activity.title}
                    type="button"
                    variant="outline"
                    className={selected ? getHighlightClasses('Games & Activities') : ''}
                    onClick={() => handleItemSelect(activity, 'Games & Activities')}
                    title={activity.description}
                  >
                    {activity.title}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Training Skills</Label>
            <div className="flex flex-wrap gap-2">
              {trainingSkillsOptions.map((skill) => {
                const selected = isItemSelected(skill.title);
                return (
                  <Button
                    key={skill.id || skill.title}
                    type="button"
                    variant="outline"
                    className={selected ? getHighlightClasses('Training Skills') : ''}
                    onClick={() => handleItemSelect(skill, 'Training Skills')}
                    title={skill.description}
                  >
                    {skill.title}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Homework</Label>
            <div className="flex flex-wrap gap-2">
              {homeworkOptions.map((homework) => {
                const selected = isItemSelected(homework.title);
                return (
                  <Button
                    key={homework.id || homework.title}
                    type="button"
                    variant="outline"
                    className={selected ? getHighlightClasses('Homework') : ''}
                    onClick={() => handleItemSelect(homework, 'Homework')}
                    title={homework.description}
                  >
                    {homework.title}
                  </Button>
                );
              })}
            </div>
          </div>

          {customCategoryOptions.map((category) => (
            <div key={category.id} className="space-y-2">
              <Label>{category.name}</Label>
              <div className="flex flex-wrap gap-2">
                {category.items.map((item) => {
                  const selected = isItemSelected(item.title);
                  return (
                    <Button
                      key={item.id || item.title}
                      type="button"
                      variant="outline"
                      className={selected ? getHighlightClasses(category.name) : ''}
                      onClick={() => handleItemSelect(item, category.name)}
                      title={item.description}
                    >
                      {item.title}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <Label>Product Recommendations</Label>
            <div className="flex flex-wrap gap-2">
              {productRecommendations.map((product) => (
                <Button
                  key={product.id || product.title}
                  type="button"
                  variant={selectedProducts.includes(product.title) ? "default" : "outline"}
                  onClick={() => {
                    setSelectedProducts(prev =>
                      prev.includes(product.title)
                        ? prev.filter(p => p !== product.title)
                        : [...prev, product.title]
                    );
                  }}
                  title={product.description}
                >
                  {product.title}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Short Term Goals</Label>
            <div className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={shortTermGoalTitle}
                    onChange={(e) => setShortTermGoalTitle(e.target.value)}
                    placeholder="Enter goal title..."
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={shortTermGoalDescription}
                    onChange={(e) => setShortTermGoalDescription(e.target.value)}
                    placeholder="Enter goal description..."
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddShortTermGoal}
                  disabled={!shortTermGoalTitle || !shortTermGoalDescription}
                >
                  Add Goal
                </Button>
              </div>

              {shortTermGoals.map((goal, index) => (
                <div
                  key={index}
                  className="bg-[#F8FCFD] border-2 border-[#80CDDE] rounded-xl p-6 relative"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemoveShortTermGoal(index)}
                  >
                    ×
                  </Button>
                  <div className="font-medium">{goal.title}</div>
                  <div className="text-gray-600 mt-1">{goal.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSaving || !selectedClient}>
              {isSaving ? "Creating..." : "Create Report Card"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>

        {/* Preview */}
        <div 
          data-preview-container
          className={`sticky top-4 w-full max-w-2xl max-h-[80vh] overflow-y-auto hidden md:block ${
            activeTab === 'preview' ? '' : ''
          }`}
        >
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-row items-center justify-between space-x-4 p-4 border-b">
              <div className="space-y-0.5">
                <h2 className="text-lg font-semibold">Preview</h2>
                <p className="text-sm text-muted-foreground">
                  Preview of the report card
                </p>
              </div>
            </div>
            <ReportCardPreview
              date={selectedDate}
              clientName={selectedClientDetails?.name}
              dogName={selectedClientDetails?.dogName}
              summary={summary}
              selectedItems={selectedItems}
              productRecommendations={selectedProducts}
              onUpdateDescription={(cat, title, newDesc) => handleSaveEdit(cat, title, newDesc)}
            />
          </div>
        </div>

        {/* Mobile Preview */}
        <div data-preview-container className={`w-full ${activeTab === 'preview' ? 'block md:hidden' : 'hidden'}`}>
          <ReportCardPreview
            date={selectedDate}
            clientName={selectedClientDetails?.name}
            dogName={selectedClientDetails?.dogName}
            summary={summary}
            selectedItems={selectedItems}
            productRecommendations={selectedProducts}
            onUpdateDescription={(cat, title, newDesc) => handleSaveEdit(cat, title, newDesc)}
          />
        </div>
      </div>

      {/* Edit Description Dialog */}
      {editing && (
        <Dialog open onOpenChange={() => setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Description – {editing.itemTitle}</DialogTitle>
            </DialogHeader>
            <RichTextEditor value={editing.description} onChange={(val) => setEditing(curr => curr ? { ...curr, description: val } : null)} />
            <div className="flex gap-2 mt-4">
              <Button onClick={() => handleSaveEdit(editing.group, editing.itemTitle, editing.description)}>Save</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 