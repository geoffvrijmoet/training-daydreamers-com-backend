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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './sortable-key-concepts';

interface Client {
  _id: string;
  name: string;
  dogName: string;
  folders: {
    mainFolderId: string;
    sharedFolderId: string;
    privateFolderId: string;
  };
}

interface KeyConcept {
  title: string;
  description: string;
  category?: string;
}

const PRODUCT_RECOMMENDATIONS = [
  "Freedom Harness",
  "Gentle Leader",
  "Long Line",
  "Treat Pouch",
  "Clicker",
  "Kong",
  "Snuffle Mat",
  "Licki Mat",
];

function getDateString(daysAgo: number): string {
  const date = new Date();
  const easternDate = new Date(date.toLocaleString('en-US', {
    timeZone: 'America/New_York'
  }));
  easternDate.setDate(easternDate.getDate() - daysAgo);
  
  const year = easternDate.getFullYear();
  const month = String(easternDate.getMonth() + 1).padStart(2, '0');
  const day = String(easternDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString: string): { dayOfWeek: string; date: string } {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dayOfWeek = date.toLocaleString('en-US', { weekday: 'short' });
  
  return {
    dayOfWeek,
    date: `${month}/${day}`
  };
}

export function ReportCardForm() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSelectedItems((prevItems) => {
        const allItems = prevItems.flatMap(g => g.items);
        const oldIndex = allItems.findIndex(item => item.title === active.id);
        const newIndex = allItems.findIndex(item => item.title === over?.id);
        const reorderedItems = arrayMove(allItems, oldIndex, newIndex);
        
        // Group items back by category
        return Object.entries(
          reorderedItems.reduce((acc, item) => {
            const category = item.category || 'Uncategorized';
            return {
              ...acc,
              [category]: [...(acc[category] || []), item]
            };
          }, {} as Record<string, KeyConcept[]>)
        ).map(([category, items]) => ({ category, items }));
      });
    }
  }

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

  const handleItemSelect = (item: KeyConcept, category: string) => {
    setSelectedItems(prev => {
      const categoryGroup = prev.find(g => g.category === category);
      if (!categoryGroup) {
        return [...prev, { category, items: [{ ...item, category }] }];
      }
      
      return prev.map(g => 
        g.category === category
          ? { ...g, items: [...g.items, { ...item, category }] }
          : g
      );
    });
  };

  const handleItemRemove = (item: KeyConcept) => {
    setSelectedItems(prev => 
      prev.map(g => ({
        ...g,
        items: g.items.filter(i => i.title !== item.title)
      })).filter(g => g.items.length > 0)
    );
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
    const data = {
      clientId: selectedClient,
      date: selectedDate,
      summary: formData.get("summary"),
      selectedItems,
      productRecommendations: selectedProducts,
      clientName: client.name,
      dogName: client.dogName,
      sharedFolderId: client.folders.sharedFolderId,
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
            <Label>Selected Items</Label>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={selectedItems.flatMap(g => g.items).map(item => item.title)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2">
                  {selectedItems.map(group => (
                    <div key={group.category} className="space-y-2">
                      <h3 className="font-medium text-sm text-gray-500">{group.category}</h3>
                      {group.items.map((item) => (
                        <SortableItem
                          key={item.title}
                          id={item.title}
                          title={item.title}
                          isSelected={true}
                          onClick={() => handleItemRemove(item)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="space-y-2">
            <Label>Key Concepts</Label>
            <div className="flex flex-wrap gap-2">
              {keyConceptOptions
                .filter(concept => !selectedItems.flatMap(g => g.items).some(i => i.title === concept.title))
                .map((concept) => (
                  <Button
                    key={concept.title}
                    type="button"
                    variant="outline"
                    onClick={() => handleItemSelect(concept, 'Key Concepts')}
                    title={concept.description}
                  >
                    {concept.title}
                  </Button>
                ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Games & Activities</Label>
            <div className="flex flex-wrap gap-2">
              {gamesAndActivitiesOptions
                .filter(activity => !selectedItems.flatMap(g => g.items).some(i => i.title === activity.title))
                .map((activity) => (
                  <Button
                    key={activity.title}
                    type="button"
                    variant="outline"
                    onClick={() => handleItemSelect(activity, 'Games & Activities')}
                    title={activity.description}
                  >
                    {activity.title}
                  </Button>
                ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Training Skills</Label>
            <div className="flex flex-wrap gap-2">
              {trainingSkillsOptions
                .filter(skill => !selectedItems.flatMap(g => g.items).some(i => i.title === skill.title))
                .map((skill) => (
                  <Button
                    key={skill.title}
                    type="button"
                    variant="outline"
                    onClick={() => handleItemSelect(skill, 'Training Skills')}
                    title={skill.description}
                  >
                    {skill.title}
                  </Button>
                ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Homework</Label>
            <div className="flex flex-wrap gap-2">
              {homeworkOptions
                .filter(homework => !selectedItems.flatMap(g => g.items).some(i => i.title === homework.title))
                .map((homework) => (
                  <Button
                    key={homework.title}
                    type="button"
                    variant="outline"
                    onClick={() => handleItemSelect(homework, 'Homework')}
                    title={homework.description}
                  >
                    {homework.title}
                  </Button>
                ))}
            </div>
          </div>

          {customCategoryOptions.map((category) => (
            <div key={category.id} className="space-y-2">
              <Label>{category.name}</Label>
              <div className="flex flex-wrap gap-2">
                {category.items
                  .filter(item => !selectedItems.flatMap(g => g.items).some(i => i.title === item.title))
                  .map((item) => (
                    <Button
                      key={item.title}
                      type="button"
                      variant="outline"
                      onClick={() => handleItemSelect(item, category.name)}
                      title={item.description}
                    >
                      {item.title}
                    </Button>
                  ))}
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <Label>Product Recommendations</Label>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_RECOMMENDATIONS.map((product) => (
                <Button
                  key={product}
                  type="button"
                  variant={selectedProducts.includes(product) ? "default" : "outline"}
                  onClick={() => {
                    setSelectedProducts(prev =>
                      prev.includes(product)
                        ? prev.filter(p => p !== product)
                        : [...prev, product]
                    );
                  }}
                >
                  {product}
                </Button>
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
          className={`sticky top-4 w-full max-w-2xl ${
            activeTab === 'preview' ? 'block' : 'hidden md:block'
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
            />
          </div>
        </div>

        {/* Mobile Preview */}
        <div className={`w-full ${activeTab === 'preview' ? 'block md:hidden' : 'hidden'}`}>
          <ReportCardPreview
            date={selectedDate}
            clientName={selectedClientDetails?.name}
            dogName={selectedClientDetails?.dogName}
            summary={summary}
            selectedItems={selectedItems}
            productRecommendations={selectedProducts}
          />
        </div>
      </div>
    </div>
  );
} 