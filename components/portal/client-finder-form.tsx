"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ClientFinderForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dogName, setDogName] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<{ clientId: string; clientName: string; dogName: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFound(null);
    try {
      const res = await fetch("/api/portal/find-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, dogName, email }),
      });
      const data = await res.json();
      if (data.success) {
        setFound({ clientId: data.clientId, clientName: data.clientName, dogName: data.dogName });
      } else {
        setError(data.error || "No matching client found.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-6 bg-white p-8 rounded-3xl shadow-lg">
      <h1 className="text-3xl font-bold text-gray-800 text-center">Client Portal</h1>
      <p className="text-center text-gray-600 text-sm">Enter your details to find your account</p>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700" htmlFor="dogName">Dog&apos;s Name<span className="text-red-500">*</span></label>
        <Input id="dogName" value={dogName} onChange={(e) => setDogName(e.target.value)} placeholder="Fido" required />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700" htmlFor="email">Email<span className="text-red-500">*</span></label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700" htmlFor="name">Your Name (optional)</label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
      </div>

      {error && <p className="text-red-700 text-sm text-center">{error}</p>}

      <Button type="submit" className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-800" disabled={loading}>{loading ? "Searching..." : "Find My Account"}</Button>

      {found && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-center space-y-4 animate-fade-in">
          <div className="text-green-700 font-medium text-lg">Account found!</div>
          <p className="text-gray-700">{found.dogName} &amp; {found.clientName}</p>
          <Button onClick={() => router.push(`/portal/clients/${found.clientId}`)} className="bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800">
            Go to My Portal
          </Button>
        </div>
      )}
    </form>
  );
} 