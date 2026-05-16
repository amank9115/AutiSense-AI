"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Input } from "@/components/ui/StitchUI";
import { authApi } from "@/services/authApi";
import Image from "next/image";
import Link from "next/link";

export default function ParentProfilePage() {
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
      setSuccess("Profile updated successfully!");
      updateUser({ ...user, name: formData.name });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex">
      {/* Sidebar */}
      <aside className="w-80 h-screen fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant/10 p-8 flex flex-col z-50">
        <div className="mb-12 px-2">
          <Link href="/dashboard/parent">
            <h1 className="font-headline font-bold text-primary text-2xl tracking-tight leading-none mb-1 hover:text-primary/80 transition-colors">MannSaathi</h1>
          </Link>
          <p className="text-[10px] font-extrabold text-primary uppercase tracking-[0.3em] opacity-40">Parent Portal</p>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { icon: "dashboard", label: "Overview", href: "/dashboard/parent" },
            { icon: "group", label: "My Children" },
            { icon: "calendar_month", label: "Appointments" },
            { icon: "assignment", label: "Screening History" },
            { icon: "folder_shared", label: "Reports" },
          ].map((item, i) => (
            <Link
              key={i}
              href={item.href || "#"}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${i === 0 ? "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest" : "text-on-surface-variant hover:bg-surface-container-high"}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-extrabold text-[10px] uppercase tracking-widest">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-outline-variant/10">
          <button
            onClick={() => router.push("/dashboard/parent")}
            className="w-full bg-primary text-on-primary p-4 rounded-3xl flex items-center gap-4 shadow-inner hover:bg-primary/90 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-extrabold truncate">{user.name}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Parent</p>
            </div>
                      </button>
        </div>
      </aside>

      <main className="flex-1 ml-80 p-10 lg:p-16">
        <header className="flex items-center justify-between mb-12">
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
          <div className="mb-6 bg-success/10 border border-success/20 text-success text-sm font-bold p-4 rounded-2xl">
            {success}
          </div>
        )}

        {/* Profile Header */}
        <Card className="p-8 rounded-3xl bg-white shadow-xl mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-white text-5xl font-bold shadow-xl">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="text-center md:text-left">
              <h3 className="font-headline font-extrabold text-3xl text-on-surface">{user.name}</h3>
              <p className="text-on-surface-variant font-medium mt-1">{user.email}</p>
              <span className="inline-block mt-3 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                Parent / Caregiver
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
                  disabled={!isEditing}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="font-headline font-extrabold text-xs text-on-surface uppercase tracking-widest opacity-60">
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

        {/* Children Section */}
        <Card className="p-8 rounded-3xl bg-white shadow-xl mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline font-extrabold text-xl text-on-surface">My Children</h3>
            <Button variant="outline" className="text-sm px-4 py-2">
              Add Child
            </Button>
          </div>
          <div className="text-center py-12 text-on-surface-variant">
            <span className="material-symbols-outlined text-6xl opacity-20 mb-4">child_care</span>
            <p className="font-medium">No children added yet</p>
            <p className="text-sm opacity-60 mt-1">Add your child to start tracking their progress</p>
          </div>
        </Card>

        {/* Account Actions */}
        <Card className="p-8 rounded-3xl bg-white shadow-xl">
          <h3 className="font-headline font-extrabold text-xl text-on-surface mb-6">
            Account Actions
          </h3>
          <div className="space-y-4">
            <button
              onClick={() => router.push("/dashboard/parent")}
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
      </main>
    </div>
  );
}
