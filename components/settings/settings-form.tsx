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

interface KeyConcept {
  title: string;
  description: string;
}

interface Settings {
  keyConcepts: KeyConcept[];
  productRecommendations: string[];
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

export function SettingsForm() {
  const [settings, setSettings] = useState<Settings>({ keyConcepts: [], productRecommendations: [] });
  const [newConceptTitle, setNewConceptTitle] = useState("");
  const [newConceptDescription, setNewConceptDescription] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConceptForm, setShowConceptForm] = useState(false);
  const [conceptToDelete, setConceptToDelete] = useState<string | null>(null);
  const [editingConcept, setEditingConcept] = useState<KeyConcept | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch settings');
        }

        setSettings(data.settings);
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

  function addProduct(e: React.FormEvent) {
    e.preventDefault();
    if (newProduct.trim()) {
      setSettings(prev => ({
        ...prev,
        productRecommendations: [...prev.productRecommendations, newProduct.trim()]
      }));
      setNewProduct("");
    }
  }

  function removeKeyConcept(title: string) {
    setSettings(prev => ({
      ...prev,
      keyConcepts: prev.keyConcepts.filter(c => c.title !== title)
    }));
  }

  function removeProduct(product: string) {
    setSettings(prev => ({
      ...prev,
      productRecommendations: prev.productRecommendations.filter(p => p !== product)
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
  const handleEditClick = (concept: KeyConcept) => {
    // Log the content to debug
    console.log('Original content:', concept.description);
    
    // Don't try to decode HTML entities - pass the content directly to the editor
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
          <form onSubmit={addKeyConcept} className="space-y-4 border rounded-lg p-4 bg-gray-50">
            <div className="space-y-2">
              <Label htmlFor="conceptTitle">Title</Label>
              <Input
                id="conceptTitle"
                value={newConceptTitle}
                onChange={(e) => setNewConceptTitle(e.target.value)}
                placeholder="e.g., Trigger Stacking"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conceptDescription">Description</Label>
              <RichTextEditor
                value={newConceptDescription}
                onChange={setNewConceptDescription}
                placeholder="Explain the concept..."
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Add Concept</Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowConceptForm(false);
                  setNewConceptTitle("");
                  setNewConceptDescription("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {settings.keyConcepts.map((concept) => (
            <div
              key={concept.title}
              className="relative border rounded-lg p-4 bg-white"
            >
              {editingConcept?.title === concept.title ? (
                <form onSubmit={updateKeyConcept} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="editTitle">Title</Label>
                    <Input
                      id="editTitle"
                      value={editingConcept.title}
                      onChange={(e) => setEditingConcept(prev => ({
                        ...prev!,
                        title: e.target.value
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editDescription">Description</Label>
                    <RichTextEditor
                      value={editingConcept.description}
                      onChange={(value) => setEditingConcept(prev => ({
                        ...prev!,
                        description: value
                      }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setEditingConcept(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => handleEditClick(concept)}
                      className="text-gray-500 hover:text-blue-500"
                      title="Edit"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                        <path d="m15 5 4 4"/>
                      </svg>
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
        <h2 className="text-xl font-semibold">Product Recommendations</h2>
        <form onSubmit={addProduct} className="flex gap-2">
          <Input
            value={newProduct}
            onChange={(e) => setNewProduct(e.target.value)}
            placeholder="Add new product..."
          />
          <Button type="submit">Add</Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {settings.productRecommendations.map((product) => (
            <div
              key={product}
              className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full"
            >
              {product}
              <button
                onClick={() => removeProduct(product)}
                className="text-gray-500 hover:text-red-500"
              >
                <X size={14} />
              </button>
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