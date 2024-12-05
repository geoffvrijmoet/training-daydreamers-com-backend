"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Pencil, Link as LinkIcon } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface DescribedItem {
  title: string;
  description: string;
}

interface Settings {
  keyConcepts: DescribedItem[];
  productRecommendations: DescribedItem[];
  gamesAndActivities: DescribedItem[];
  trainingSkills: DescribedItem[];
  homework: DescribedItem[];
}

interface LinkDialogProps {
  onInsert: (url: string, text: string) => void;
}

function LinkDialog({ onInsert }: LinkDialogProps) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);

  const formatUrl = (inputUrl: string): string => {
    let formattedUrl = inputUrl.trim();
    
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    
    if (formattedUrl.startsWith('http://')) {
      formattedUrl = 'https://' + formattedUrl.slice(7);
    }
    
    return formattedUrl;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && text) {
      onInsert(formatUrl(url), text);
      setUrl("");
      setText("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <LinkIcon size={16} />
          Insert Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert Link</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="linkText">Link Text</Label>
            <Input
              id="linkText"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g., Click here"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkUrl">URL</Label>
            <Input
              id="linkUrl"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g., https://example.com"
            />
          </div>
          <Button
            type="submit"
            disabled={!url || !text}
            variant="dark"
          >
            Insert
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add this CSS class to preserve list styling
const descriptionStyles = `
  prose prose-zinc 
  [&_ul]:list-disc [&_ul]:pl-6 
  [&_ol]:list-decimal [&_ol]:pl-6
  [&_li]:my-0
`;

function ItemForm({ 
  initialTitle = "", 
  initialDescription = "", 
  onSubmit, 
  onCancel, 
  submitLabel = "Add",
  placeholder
}: {
  initialTitle?: string;
  initialDescription?: string;
  onSubmit: (title: string, description: string) => void;
  onCancel: () => void;
  submitLabel?: string;
  placeholder?: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit(title, description);
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
        <Label htmlFor="description">Description</Label>
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="Add description..."
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">{submitLabel}</Button>
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

export function SettingsForm() {
  const [settings, setSettings] = useState<Settings>({ 
    keyConcepts: [], 
    productRecommendations: [], 
    gamesAndActivities: [], 
    trainingSkills: [], 
    homework: [] 
  });
  
  // Form visibility state
  const [showConceptForm, setShowConceptForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showGameActivityForm, setShowGameActivityForm] = useState(false);
  const [showTrainingSkillForm, setShowTrainingSkillForm] = useState(false);
  const [showHomeworkForm, setShowHomeworkForm] = useState(false);

  // New item state
  const [newConceptTitle, setNewConceptTitle] = useState("");
  const [newConceptDescription, setNewConceptDescription] = useState("");
  const [newProduct, setNewProduct] = useState<DescribedItem>({ title: "", description: "" });
  const [newGameActivity, setNewGameActivity] = useState<DescribedItem>({ title: "", description: "" });
  const [newTrainingSkill, setNewTrainingSkill] = useState<DescribedItem>({ title: "", description: "" });
  const [newHomework, setNewHomework] = useState<DescribedItem>({ title: "", description: "" });

  // Editing state
  const [editingConcept, setEditingConcept] = useState<DescribedItem | null>(null);
  const [editingProduct, setEditingProduct] = useState<DescribedItem | null>(null);
  const [editingGameActivity, setEditingGameActivity] = useState<DescribedItem | null>(null);
  const [editingTrainingSkill, setEditingTrainingSkill] = useState<DescribedItem | null>(null);
  const [editingHomework, setEditingHomework] = useState<DescribedItem | null>(null);

  // Delete confirmation state
  const [conceptToDelete, setConceptToDelete] = useState<string | null>(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch settings');
        }

        setSettings({
          keyConcepts: data.settings.keyConcepts || [],
          productRecommendations: data.settings.productRecommendations || [],
          gamesAndActivities: data.settings.gamesAndActivities || [],
          trainingSkills: data.settings.trainingSkills || [],
          homework: data.settings.homework || [],
        });
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, []);

  async function saveSettings() {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
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

  async function addKeyConcept(e: React.FormEvent) {
    e.preventDefault();
    if (newConceptTitle.trim() && newConceptDescription.trim()) {
      setIsSaving(true);
      setError(null);

      const newConcept = {
        title: newConceptTitle.trim(),
        description: newConceptDescription.trim()
      };

      try {
        const response = await fetch('/api/settings/key-concepts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newConcept),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to add concept');
        }

        setSettings(prev => ({
          ...prev,
          keyConcepts: [...prev.keyConcepts, newConcept]
        }));
        setNewConceptTitle("");
        setNewConceptDescription("");
        setShowConceptForm(false);
      } catch (error) {
        console.error('Error adding concept:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsSaving(false);
      }
    }
  }

  function removeKeyConcept(title: string) {
    setSettings(prev => ({
      ...prev,
      keyConcepts: prev.keyConcepts.filter(c => c.title !== title)
    }));
  }

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

  async function updateKeyConcept(e: React.FormEvent) {
    e.preventDefault();
    if (!editingConcept) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/settings/key-concepts/${encodeURIComponent(editingConcept.title)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingConcept),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update concept');
      }

      setSettings(prev => ({
        ...prev,
        keyConcepts: prev.keyConcepts.map(c => 
          c.title === editingConcept.title ? editingConcept : c
        )
      }));
      setEditingConcept(null);
    } catch (error) {
      console.error('Error updating concept:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  }

  function insertLink(url: string, text: string, fieldId: string) {
    const textarea = document.getElementById(fieldId) as HTMLTextAreaElement;
    if (!textarea) return;

    const markdownLink = `[${text}](${url})`;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;
    
    const newValue = currentValue.substring(0, start) + 
      markdownLink + 
      currentValue.substring(end);

    if (editingConcept) {
      setEditingConcept(prev => ({
        ...prev!,
        description: newValue
      }));
    } else {
      setNewConceptDescription(newValue);
    }
  }

  // Update the handleEditClick function
  const handleEditClick = (concept: DescribedItem) => {
    console.log('Original content:', concept.description);
    setEditingConcept({
      title: concept.title,
      description: concept.description
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-8 max-w-2xl">
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Key Concepts</h2>
          <Button 
            variant="outline" 
            onClick={() => setShowConceptForm(true)}
            className="mb-4"
          >
            Add New Concept
          </Button>
        </div>

        {showConceptForm && (
          <ItemForm
            initialTitle=""
            initialDescription=""
            onSubmit={(title, description) => {
              setSettings(prev => ({
                ...prev,
                keyConcepts: [...prev.keyConcepts, { title, description }]
              }));
              setShowConceptForm(false);
            }}
            onCancel={() => setShowConceptForm(false)}
            placeholder="e.g., Trigger Stacking"
          />
        )}

        <div className="space-y-4">
          {settings.keyConcepts.map((concept) => (
            <div
              key={concept.title}
              className="relative border rounded-lg p-4 bg-white"
            >
              {editingConcept && editingConcept.title === concept.title ? (
                <ItemForm
                  initialTitle={editingConcept.title}
                  initialDescription={editingConcept.description}
                  onSubmit={(title, description) => {
                    setSettings(prev => ({
                      ...prev,
                      keyConcepts: prev.keyConcepts.map(c =>
                        c.title === concept.title ? { title, description } : c
                      )
                    }));
                    setEditingConcept(null);
                  }}
                  onCancel={() => setEditingConcept(null)}
                  submitLabel="Save"
                />
              ) : (
                <>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => setEditingConcept(concept)}
                      className="text-gray-500 hover:text-blue-500"
                      title="Edit"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => setConceptToDelete(concept.title)}
                      className="text-gray-500 hover:text-red-500"
                      disabled={isSaving}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{concept.title}</h3>
                  <div 
                    className={descriptionStyles}
                    dangerouslySetInnerHTML={{ __html: concept.description }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Product Recommendations</h2>
          <Button 
            variant="outline" 
            onClick={() => setShowProductForm(true)}
            className="mb-4"
          >
            Add New Product
          </Button>
        </div>

        {showProductForm && (
          <ItemForm
            initialTitle=""
            initialDescription=""
            onSubmit={(title, description) => {
              setSettings(prev => ({
                ...prev,
                productRecommendations: [...prev.productRecommendations, { title, description }]
              }));
              setShowProductForm(false);
            }}
            onCancel={() => setShowProductForm(false)}
            placeholder="e.g., Freedom Harness"
          />
        )}

        <div className="space-y-4">
          {settings.productRecommendations.map((product) => (
            <div
              key={product.title}
              className="relative border rounded-lg p-4 bg-white"
            >
              {editingProduct && editingProduct.title === product.title ? (
                <ItemForm
                  initialTitle={editingProduct.title}
                  initialDescription={editingProduct.description}
                  onSubmit={(title, description) => {
                    setSettings(prev => ({
                      ...prev,
                      productRecommendations: prev.productRecommendations.map(p =>
                        p.title === product.title ? { title, description } : p
                      )
                    }));
                    setEditingProduct(null);
                  }}
                  onCancel={() => setEditingProduct(null)}
                  submitLabel="Save"
                />
              ) : (
                <>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="text-gray-500 hover:text-blue-500"
                      title="Edit"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          productRecommendations: prev.productRecommendations.filter(
                            p => p.title !== product.title
                          )
                        }));
                      }}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{product.title}</h3>
                  <div 
                    className={descriptionStyles}
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Games & Activities</h2>
          <Button 
            variant="outline" 
            onClick={() => setShowGameActivityForm(true)}
            className="mb-4"
          >
            Add New Game/Activity
          </Button>
        </div>

        {showGameActivityForm && (
          <ItemForm
            initialTitle={newGameActivity.title}
            initialDescription={newGameActivity.description}
            onSubmit={(title, description) => {
              setSettings(prev => ({
                ...prev,
                gamesAndActivities: [...prev.gamesAndActivities, { title, description }]
              }));
              setNewGameActivity({ title: "", description: "" });
              setShowGameActivityForm(false);
            }}
            onCancel={() => {
              setNewGameActivity({ title: "", description: "" });
              setShowGameActivityForm(false);
            }}
            placeholder="e.g., Find It Game"
          />
        )}

        <div className="space-y-4">
          {settings.gamesAndActivities.map((activity) => (
            <div
              key={activity.title}
              className="relative border rounded-lg p-4 bg-white"
            >
              {editingGameActivity?.title === activity.title ? (
                <ItemForm
                  initialTitle={editingGameActivity.title}
                  initialDescription={editingGameActivity.description}
                  onSubmit={(title, description) => {
                    setSettings(prev => ({
                      ...prev,
                      gamesAndActivities: prev.gamesAndActivities.map(a =>
                        a.title === activity.title ? { title, description } : a
                      )
                    }));
                    setEditingGameActivity(null);
                  }}
                  onCancel={() => setEditingGameActivity(null)}
                  submitLabel="Save"
                />
              ) : (
                <>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => setEditingGameActivity(activity)}
                      className="text-gray-500 hover:text-blue-500"
                      title="Edit"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          gamesAndActivities: prev.gamesAndActivities.filter(
                            a => a.title !== activity.title
                          )
                        }));
                      }}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{activity.title}</h3>
                  <div 
                    className={descriptionStyles}
                    dangerouslySetInnerHTML={{ __html: activity.description }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Training Skills</h2>
          <Button 
            variant="outline" 
            onClick={() => setShowTrainingSkillForm(true)}
            className="mb-4"
          >
            Add New Skill
          </Button>
        </div>

        {showTrainingSkillForm && (
          <ItemForm
            initialTitle={newTrainingSkill.title}
            initialDescription={newTrainingSkill.description}
            onSubmit={(title, description) => {
              setSettings(prev => ({
                ...prev,
                trainingSkills: [...prev.trainingSkills, { title, description }]
              }));
              setNewTrainingSkill({ title: "", description: "" });
              setShowTrainingSkillForm(false);
            }}
            onCancel={() => {
              setNewTrainingSkill({ title: "", description: "" });
              setShowTrainingSkillForm(false);
            }}
            placeholder="e.g., Marker Timing"
          />
        )}

        <div className="space-y-4">
          {settings.trainingSkills.map((skill) => (
            <div
              key={skill.title}
              className="relative border rounded-lg p-4 bg-white"
            >
              {editingTrainingSkill?.title === skill.title ? (
                <ItemForm
                  initialTitle={editingTrainingSkill.title}
                  initialDescription={editingTrainingSkill.description}
                  onSubmit={(title, description) => {
                    setSettings(prev => ({
                      ...prev,
                      trainingSkills: prev.trainingSkills.map(s =>
                        s.title === skill.title ? { title, description } : s
                      )
                    }));
                    setEditingTrainingSkill(null);
                  }}
                  onCancel={() => setEditingTrainingSkill(null)}
                  submitLabel="Save"
                />
              ) : (
                <>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => setEditingTrainingSkill(skill)}
                      className="text-gray-500 hover:text-blue-500"
                      title="Edit"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          trainingSkills: prev.trainingSkills.filter(
                            s => s.title !== skill.title
                          )
                        }));
                      }}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{skill.title}</h3>
                  <div 
                    className={descriptionStyles}
                    dangerouslySetInnerHTML={{ __html: skill.description }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Homework</h2>
          <Button 
            variant="outline" 
            onClick={() => setShowHomeworkForm(true)}
            className="mb-4"
          >
            Add New Homework
          </Button>
        </div>

        {showHomeworkForm && (
          <ItemForm
            initialTitle={newHomework.title}
            initialDescription={newHomework.description}
            onSubmit={(title, description) => {
              setSettings(prev => ({
                ...prev,
                homework: [...prev.homework, { title, description }]
              }));
              setNewHomework({ title: "", description: "" });
              setShowHomeworkForm(false);
            }}
            onCancel={() => {
              setNewHomework({ title: "", description: "" });
              setShowHomeworkForm(false);
            }}
            placeholder="e.g., Practice Recall"
          />
        )}

        <div className="space-y-4">
          {settings.homework.map((task) => (
            <div
              key={task.title}
              className="relative border rounded-lg p-4 bg-white"
            >
              {editingHomework?.title === task.title ? (
                <ItemForm
                  initialTitle={editingHomework.title}
                  initialDescription={editingHomework.description}
                  onSubmit={(title, description) => {
                    setSettings(prev => ({
                      ...prev,
                      homework: prev.homework.map(h =>
                        h.title === task.title ? { title, description } : h
                      )
                    }));
                    setEditingHomework(null);
                  }}
                  onCancel={() => setEditingHomework(null)}
                  submitLabel="Save"
                />
              ) : (
                <>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => setEditingHomework(task)}
                      className="text-gray-500 hover:text-blue-500"
                      title="Edit"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => {
                        setSettings(prev => ({
                          ...prev,
                          homework: prev.homework.filter(
                            h => h.title !== task.title
                          )
                        }));
                      }}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{task.title}</h3>
                  <div 
                    className={descriptionStyles}
                    dangerouslySetInnerHTML={{ __html: task.description }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="pt-4">
        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

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
    </div>
  );
} 