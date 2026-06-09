"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Input } from "@/components/ui/StitchUI";
import { authApi } from "@/services/authApi";
import Image from "next/image";
import Link from "next/link";

export default function DoctorProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    specialization: "",
    licenseNumber: "",
    hospital: "",
    yearsOfExperience: "",
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
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      setSuccess("Profile updated successfully!");
      updateUser({ ...user, name: formData.name });
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-on-surface font-body antialiased p-6 lg:p-10">
      <div>
        <header className="flex items-center justify-between mb-12">
          <div>
            <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight">My Profile</h2>
            <p className="text-on-surface-variant font-medium mt-2">Manage your professional account</p>
          </div>
        </header>

        {error && (
          <div className="mb-6 bg-error/10 border border-error/20 text-error text-sm font-bold p-4 rounded-2xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-success/10 border border-success/20 text-success text-sm font-bold p-4 rounded-2xl">
            {success}
          </div>
        )}

        {/* Profile Header */}
        <Card className="p-8 rounded-3xl bg-white shadow-xl mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-full bg-secondary flex items-center justify-center text-white text-5xl font-bold shadow-xl">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-headline font-extrabold text-3xl text-on-surface">{user.name}</h3>
              <p className="text-on-surface-variant font-medium mt-1">{user.email}</p>
              <span className="inline-block mt-3 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-widest">
                Healthcare Provider
              </span>
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="p-8 rounded-3xl bg-white shadow-xl mb-8">
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
                <label className="font-headline font-extrabold text-xs text-label-caps text-on-surface-muted">
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
                <label className="font-headline font-extrabold text-xs text-label-caps text-on-surface-muted">
                  Email Address
                </label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="font-headline font-extrabold text-xs text-label-caps text-on-surface-muted">
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
                <label className="font-headline font-extrabold text-xs text-label-caps text-on-surface-muted">
                  Account Type
                </label>
                <Input
                  value="Healthcare Provider"
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
                    setFormData({ name: user.name, email: user.email, phone: "", specialization: "", licenseNumber: "", hospital: "", yearsOfExperience: "" });
                  }}
                  className="px-8"
                >
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </Card>

        {/* Professional Information */}
        <Card className="p-8 rounded-3xl bg-white shadow-xl mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline font-extrabold text-xl text-on-surface">Professional Information</h3>
            <Button variant="outline" className="text-sm px-4 py-2">
              Edit
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-headline font-extrabold text-xs text-label-caps text-on-surface-muted">
                License Number
              </label>
              <Input
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                placeholder="Enter license number"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="font-headline font-extrabold text-xs text-label-caps text-on-surface-muted">
                Specialization
              </label>
              <Input
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                placeholder="e.g., Pediatric Neurology"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="font-headline font-extrabold text-xs text-label-caps text-on-surface-muted">
                Hospital / Clinic
              </label>
              <Input
                name="hospital"
                value={formData.hospital}
                onChange={handleChange}
                placeholder="Enter hospital or clinic name"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="font-headline font-extrabold text-xs text-label-caps text-on-surface-muted">
                Years of Experience
              </label>
              <Input
                name="yearsOfExperience"
                type="number"
                value={formData.yearsOfExperience}
                onChange={handleChange}
                placeholder="0"
                className="w-full"
              />
            </div>
          </div>
        </Card>

        {/* Account Actions */}
        <Card className="p-8 rounded-3xl bg-white shadow-xl">
          <h3 className="font-headline font-extrabold text-xl text-on-surface mb-6">
            Account Actions
          </h3>
          <div className="space-y-4">
            <button
              onClick={() => router.push("/dashboard/doctor")}
              className="w-full text-left p-4 rounded-2xl border border-surface-container-high hover:bg-surface-container-low transition"
            >
              <span className="font-semibold text-on-surface">Back to Dashboard</span>
              <p className="text-sm text-on-surface-variant mt-1">Return to your dashboard</p>
            </button>
            <button
              onClick={() => {
                if (confirm("Are you sure you want to logout?")) {
                  logout();
                  router.push("/");
                }
              }}
              className="w-full text-left p-4 rounded-2xl border border-rose-200 hover:bg-rose-50 transition"
            >
              <span className="font-semibold text-rose-600">Logout</span>
              <p className="text-sm text-on-surface-variant mt-1">Sign out of your account</p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
