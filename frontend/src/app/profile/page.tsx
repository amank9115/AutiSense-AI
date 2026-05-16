"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Input } from "@/components/ui/StitchUI";
import { Navbar, Footer } from "@/components/layout/Navigation";
import { authApi } from "@/services/authApi";

export default function ProfilePage() {
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
      // In a real app, this would call an update profile API
      setSuccess("Profile updated successfully!");
      updateUser({ ...user, name: formData.name });
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Placeholder for password change logic
      setSuccess("Password changed successfully!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const isDoctor = user.role === "doctor";

  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col">
      <Navbar />

      <main className="flex-grow pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Header */}
          <div className="text-center space-y-4">
            <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-bold shadow-xl">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
                {user.name}
              </h1>
              <p className="text-on-surface-variant font-medium mt-1">
                {isDoctor ? "Healthcare Provider" : "Parent / Caregiver"}
              </p>
              <span className={`inline-block mt-2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isDoctor
                  ? "bg-secondary/10 text-secondary"
                  : "bg-primary/10 text-primary"
              }`}>
                {user.role}
              </span>
            </div>
          </div>

          {/* Profile Information */}
          <Card className="p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline font-extrabold text-xl text-on-surface">Personal Information</h2>
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

            {error && (
              <div className="mb-4 bg-error/10 border border-error/20 text-error text-sm font-bold p-4 rounded-2xl">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-success/10 border border-success/20 text-success text-sm font-bold p-4 rounded-2xl">
                {success}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-headline font-extrabold text-xs text-on-surface uppercase tracking-widest opacity-60">
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
                  <label className="font-headline font-extrabold text-xs text-on-surface uppercase tracking-widest opacity-60">
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
                  <label className="font-headline font-extrabold text-xs text-on-surface uppercase tracking-widest opacity-60">
                    Phone Number
                  </label>
                  <Input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Add phone number"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-headline font-extrabold text-xs text-on-surface uppercase tracking-widest opacity-60">
                    Account Type
                  </label>
                  <Input
                    value={isDoctor ? "Healthcare Provider" : "Parent / Caregiver"}
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
                      setFormData({ name: user.name, email: user.email, phone: "" });
                    }}
                    className="px-8"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </form>
          </Card>

          {/* Doctor-specific fields */}
          {isDoctor && (
            <Card className="p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl">
              <h2 className="font-headline font-extrabold text-xl text-on-surface mb-6">
                Professional Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-headline font-extrabold text-xs text-on-surface uppercase tracking-widest opacity-60">
                    License Number
                  </label>
                  <Input placeholder="Enter license number" className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="font-headline font-extrabold text-xs text-on-surface uppercase tracking-widest opacity-60">
                    Specialization
                  </label>
                  <Input placeholder="e.g., Pediatric Neurology" className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="font-headline font-extrabold text-xs text-on-surface uppercase tracking-widest opacity-60">
                    Hospital / Clinic
                  </label>
                  <Input placeholder="Enter hospital or clinic name" className="w-full" />
                </div>
                <div className="space-y-2">
                  <label className="font-headline font-extrabold text-xs text-on-surface uppercase tracking-widest opacity-60">
                    Years of Experience
                  </label>
                  <Input type="number" placeholder="0" className="w-full" />
                </div>
              </div>
            </Card>
          )}

          {/* Account Actions */}
          <Card className="p-6 sm:p-8 rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl">
            <h2 className="font-headline font-extrabold text-xl text-on-surface mb-6">
              Account Actions
            </h2>
            <div className="space-y-4">
              <button
                onClick={() => router.push("/dashboard/parent")}
                className="w-full text-left p-4 rounded-2xl border border-surface-container-high hover:bg-surface-container-low transition"
              >
                <span className="font-semibold text-on-surface">Go to Dashboard</span>
                <p className="text-sm text-on-surface-variant mt-1">Access your personalized dashboard</p>
              </button>
              <button
                onClick={async () => {
                  if (confirm("Are you sure you want to logout?")) {
                    try {
                      await authApi.login(user.email, "");
                      logout();
                      router.push("/");
                    } catch {
                      logout();
                      router.push("/");
                    }
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
      </main>

      <Footer />
    </div>
  );
}
