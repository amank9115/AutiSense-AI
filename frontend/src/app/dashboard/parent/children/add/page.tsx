"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Input } from "@/components/ui/StitchUI";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { screeningApi } from "@/services/api/screeningApi";

export default function AddChildPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    gender: "",
    medicalNotes: "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.name.trim().length < 2) {
      setError("Child's name must be at least 2 characters long.");
      return;
    }

    const dob = new Date(formData.dateOfBirth);
    const today = new Date();
    if (dob > today) {
      setError("Date of birth cannot be in the future.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await (screeningApi.saveChildProfile as (p: unknown) => Promise<unknown>)({
        childName: formData.name,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        medicalNotes: formData.medicalNotes,
      });

      router.push("/dashboard/parent/children");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save child profile";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb className="mb-6" />

      <Card className="p-8 sm:p-12 rounded-3xl">
        <h1 className="font-headline font-extrabold text-3xl text-primary mb-2">Add Child Profile</h1>
        <p className="text-on-surface-variant mb-8 font-medium">Create a profile to start tracking developmental milestones.</p>

        {error && (
          <div className="mb-6 bg-error/10 border border-error/20 text-error p-4 rounded-2xl text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="font-headline font-extrabold text-xs uppercase tracking-widest text-on-surface-muted">
              Child&apos;s Full Name
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Aarav Sharma"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-headline font-extrabold text-xs uppercase tracking-widest text-on-surface-muted">
                Date of Birth
              </label>
              <Input
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="font-headline font-extrabold text-xs uppercase tracking-widest text-on-surface-muted">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-6 py-4 rounded-full bg-surface-container-highest border-none focus:ring-4 focus:ring-primary/5 shadow-inner text-sm"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-headline font-extrabold text-xs uppercase tracking-widest text-on-surface-muted">
              Medical Notes (Optional)
            </label>
            <textarea
              name="medicalNotes"
              value={formData.medicalNotes}
              onChange={handleChange}
              placeholder="Any relevant developmental or medical history..."
              className="w-full px-6 py-4 rounded-2xl bg-surface-container-highest border-none focus:ring-4 focus:ring-primary/5 shadow-inner text-sm min-h-30"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              className="flex-1 py-4 rounded-full font-extrabold uppercase tracking-widest"
            >
              {loading ? "Saving Profile..." : "Save Profile"}
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-4 rounded-full font-extrabold uppercase tracking-widest"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
