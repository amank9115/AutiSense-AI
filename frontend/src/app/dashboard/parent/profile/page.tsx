"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Input } from "@/components/ui/StitchUI";
import { fetchJson } from "@/api/client";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export default function ParentProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.phone && !/^\+?[\d\s\-()]{7,15}$/.test(formData.phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetchJson<{ name: string }>("/api/v1/users/me", {
        method: "PUT",
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
        }),
      });
      setSuccess("Profile updated successfully!");
      if (user) updateUser({ ...user, name: response.name });
      setIsEditing(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb className="mb-6" />
      <header className="flex items-center justify-between mb-10">
        <div>
          <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight">My Profile</h2>
          <p className="text-on-surface-variant font-medium mt-2">Manage your account information</p>
        </div>
      </header>

      {error && (
        <div className="mb-6 bg-error/10 border border-error/20 text-error text-sm font-bold p-4 rounded-2xl">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-primary/10 border border-primary/20 text-primary text-sm font-bold p-4 rounded-2xl">
          {success}
        </div>
      )}

      {/* Profile Header */}
      <Card className="p-8 rounded-3xl mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-on-primary text-4xl font-bold shadow-xl shrink-0">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-headline font-extrabold text-3xl text-on-surface">{user.name}</h3>
            <p className="text-on-surface-variant font-medium mt-1">{user.email}</p>
            <span className="inline-block mt-3 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
              Parent / Caregiver
            </span>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="p-8 rounded-3xl mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline font-extrabold text-xl text-on-surface">Personal Information</h3>
          {!isEditing && (
            <Button
              variant="secondary"
              onClick={() => setIsEditing(true)}
              className="text-sm px-4 py-2"
            >
              Edit Profile
            </Button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-headline font-extrabold text-xs uppercase tracking-widest text-on-surface-muted">
                Full Name
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="font-headline font-extrabold text-xs uppercase tracking-widest text-on-surface-muted">
                Email Address
              </label>
              <Input
                name="email"
                type="email"
                value={user.email}
                disabled
                className="w-full"
              />
              <p className="text-[11px] text-on-surface-muted">Contact support to change your email address.</p>
            </div>
            <div className="space-y-2">
              <label className="font-headline font-extrabold text-xs uppercase tracking-widest text-on-surface-muted">
                Phone Number
              </label>
              <Input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Add phone number"
                disabled={!isEditing}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="font-headline font-extrabold text-xs uppercase tracking-widest text-on-surface-muted">
                Account Type
              </label>
              <Input
                value="Parent / Caregiver"
                disabled
                className="w-full"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="px-8"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({ name: user.name, phone: "" });
                  setError(null);
                }}
                className="px-8"
              >
                Cancel
              </Button>
            </div>
          )}
        </form>
      </Card>

      {/* Children Management */}
      <Card className="p-8 rounded-3xl mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-headline font-extrabold text-xl text-on-surface">My Children</h3>
            <p className="text-sm text-on-surface-variant mt-1">View and manage child profiles</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/parent/children")}
            className="text-sm px-5 py-2.5 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">child_care</span>
            Manage Children
          </Button>
        </div>
      </Card>

      {/* Account Actions */}
      <Card className="p-8 rounded-3xl">
        <h3 className="font-headline font-extrabold text-xl text-on-surface mb-6">
          Account Actions
        </h3>
        <div className="space-y-4">
          <button
            onClick={() => router.push("/dashboard/parent")}
            className="w-full text-left p-4 rounded-2xl border border-outline-variant/10 hover:bg-surface-container-low transition"
          >
            <span className="font-semibold text-on-surface">Back to Dashboard</span>
            <p className="text-sm text-on-surface-variant mt-1">Return to your dashboard overview</p>
          </button>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to logout?")) {
                logout();
                router.push("/");
              }
            }}
            className="w-full text-left p-4 rounded-2xl border border-error/20 hover:bg-error/5 transition"
          >
            <span className="font-semibold text-error">Logout</span>
            <p className="text-sm text-on-surface-variant mt-1">Sign out of your account</p>
          </button>
        </div>
      </Card>
    </div>
  );
}
