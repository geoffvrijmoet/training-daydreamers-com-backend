"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface Settings {
  keyConcepts: string[];
  productRecommendations: string[];
}

export function SettingsForm() {
  const [settings, setSettings] = useState<Settings>({ keyConcepts: [], productRecommendations: [] });
  const [newKeyConcept, setNewKeyConcept] = useState("");
  const [newProduct, setNewProduct] = useState("");
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

  function addKeyConcept(e: React.FormEvent) {
    e.preventDefault();
    if (newKeyConcept.trim()) {
      setSettings(prev => ({
        ...prev,
        keyConcepts: [...prev.keyConcepts, newKeyConcept.trim()]
      }));
      setNewKeyConcept("");
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

  function removeKeyConcept(concept: string) {
    setSettings(prev => ({
      ...prev,
      keyConcepts: prev.keyConcepts.filter(c => c !== concept)
    }));
  }

  function removeProduct(product: string) {
    setSettings(prev => ({
      ...prev,
      productRecommendations: prev.productRecommendations.filter(p => p !== product)
    }));
  }

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-8 max-w-2xl">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Key Concepts</h2>
        <form onSubmit={addKeyConcept} className="flex gap-2">
          <Input
            value={newKeyConcept}
            onChange={(e) => setNewKeyConcept(e.target.value)}
            placeholder="Add new key concept..."
          />
          <Button type="submit">Add</Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {settings.keyConcepts.map((concept) => (
            <div
              key={concept}
              className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full"
            >
              {concept}
              <button
                onClick={() => removeKeyConcept(concept)}
                className="text-gray-500 hover:text-red-500"
              >
                <X size={14} />
              </button>
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
    </div>
  );
} 