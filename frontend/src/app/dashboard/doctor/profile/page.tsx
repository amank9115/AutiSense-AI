"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Input } from "@/components/ui/StitchUI";
import { fetchJson } from "@/api/client";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export default function DoctorProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    specialization: user?.specialization || "",
    licenseNumber: user?.licenseNumber || "",
    hospital: user?.hospital || "",
    yearsExperience: user?.yearsExperience?.toString() || "",
  });

  // Change password state
  const [pwData, setPwData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

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
      const body: Record<string, unknown> = { name: formData.name, phone: formData.phone };
      if (formData.licenseNumber)   body.licenseNumber   = formData.licenseNumber;
      if (formData.specialization)  body.specialization  = formData.specialization;
      if (formData.hospital)        body.hospital        = formData.hospital;
      if (formData.yearsExperience) body.yearsExperience = parseInt(formData.yearsExperience);
      const response = await fetchJson<{ name: string }>("/api/v1/users/me", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      updateUser({ ...user, name: response.name });
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (pwData.newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (pwData.newPassword !== pwData.confirmPassword) {
      setPwError("New password and confirmation do not match.");
      return;
    }

    setPwLoading(true);
    try {
      await fetchJson("/api/v1/users/me/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: pwData.currentPassword,
          newPassword: pwData.newPassword,
        }),
      });
      setPwSuccess("Password changed successfully!");
      setPwData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="text-on-surface font-body antialiased p-6 lg:p-10">
      <Breadcrumb className="mb-6" />
      <div className="max-w-4xl">
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
          <div className="mb-6 bg-primary/10 border border-primary/20 text-primary text-sm font-bold p-4 rounded-2xl">
            {success}
          </div>
        )}

        {/* Profile Header */}
        <Card className="p-8 rounded-3xl mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center text-on-secondary text-4xl font-bold shadow-xl shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-headline font-extrabold text-3xl text-on-surface">{user.name}</h3>
              <p className="text-on-surface-variant font-medium mt-1">{user.email}</p>
              <span className="inline-block mt-3 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-widest">
                Healthcare Provider
              </span>
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="p-8 rounded-3xl mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline font-extrabold text-xl text-on-surface">Personal Information</h3>
            {!isEditing && (
              <Button variant="secondary" onClick={() => setIsEditing(true)} className="text-sm px-4 py-2">
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
                <Input name="name" value={formData.name} onChange={handleChange} disabled={!isEditing} className="w-full" />
              </div>
              <div className="space-y-2">
                <label className="font-headline font-extrabold text-xs uppercase tracking-widest text-on-surface-muted">
                  Email Address
                </label>
                <Input name="email" type="email" value={user.email} disabled className="w-full" />
                <p className="text-[11px] text-on-surface-muted">Contact your administrator to change your email address.</p>
              </div>
              <div className="space-y-2">
                <label className="font-headline font-extrabold text-xs uppercase tracking-widest text-on-surface-muted">
                  Phone Number
                </label>
                <Input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Add phone number" disabled={!isEditing} className="w-full" />
              </div>
              <div className="space-y-2">
                <label className="font-headline font-extrabold text-xs uppercase tracking-widest text-on-surface-muted">
                  Account Type
                </label>
                <Input value="Healthcare Provider" disabled className="w-full" />
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-4 pt-4">
                <Button type="submit" variant="primary" disabled={loading} className="px-8">
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ ...formData, name: user.name, phone: "" });
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

        {/* Professional Information */}
        <Card className="p-8 rounded-3xl mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline font-extrabold text-xl text-on-surface">Professional Information</h3>
            {!isEditing && (
              <Button variant="secondary" onClick={() => setIsEditing(true)} className="text-sm px-4 py-2">
                Edit Profile
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-headline font-extrabold text-xs uppercase tracking-widest text-on-surface-muted">
                License Number
              </label>
              <Input name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} placeholder="Add license number" disabled={!isEditing} className="w-full" />
            </div>
            <div className="space-y-2">
              <label className="font-headline font-extrabold text-xs uppercase tracking-widest text-on-surface-muted">
                Specialization
              </label>
              <Input name="specialization" value={formData.specialization} onChange={handleChange} placeholder="e.g. Developmental Pediatrics" disabled={!isEditing} className="w-full" />
            </div>
            <div className="space-y-2">
              <label className="font-headline font-extrabold text-xs uppercase tracking-widest text-on-surface-muted">
                Hospital / Clinic
              </label>
              <Input name="hospital" value={formData.hospital} onChange={handleChange} placeholder="Hospital or clinic name" disabled={!isEditing} className="w-full" />
            </div>
            <div className="space-y-2">
              <label className="font-headline font-extrabold text-xs uppercase tracking-widest text-on-surface-muted">
                Years of Experience
              </label>
              <Input name="yearsExperience" type="number" value={formData.yearsExperience} onChange={handleChange} placeholder="0" disabled={!isEditing} className="w-full" />
            </div>
          </div>
        </Card>

        {/* Change Password */}
        <Card className="p-8 rounded-3xl mb-8">
          <h3 className="font-headline font-extrabold text-xl text-on-surface mb-6">Change Password</h3>

          {pwError && (
            <div className="mb-6 bg-error/10 border border-error/20 text-error text-sm font-bold p-4 rounded-2xl">{pwError}</div>
          )}
          {pwSuccess && (
            <div className="mb-6 bg-primary/10 border border-primary/20 text-primary text-sm font-bold p-4 rounded-2xl">{pwSuccess}</div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="space-y-2">
              <label className="font-headline font-extrabold text-xs uppercase tracking-widest text-on-surface-muted">
                Current Password
              </label>
              <Input
                type="password"
                value={pwData.currentPassword}
                onChange={(e) => setPwData({ ...pwData, currentPassword: e.target.value })}
                placeholder="Enter current password"
                className="w-full"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-headline font-extrabold text-xs uppercase tracking-widest text-on-surface-muted">
                  New Password
                </label>
                <Input
                  type="password"
                  value={pwData.newPassword}
                  onChange={(e) => setPwData({ ...pwData, newPassword: e.target.value })}
                  placeholder="At least 8 characters"
                  className="w-full"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="font-headline font-extrabold text-xs uppercase tracking-widest text-on-surface-muted">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={pwData.confirmPassword}
                  onChange={(e) => setPwData({ ...pwData, confirmPassword: e.target.value })}
                  placeholder="Re-enter new password"
                  className="w-full"
                  required
                />
              </div>
            </div>
            <Button type="submit" variant="primary" disabled={pwLoading} className="px-8">
              {pwLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </Card>

        {/* Account Actions */}
        <Card className="p-8 rounded-3xl">
          <h3 className="font-headline font-extrabold text-xl text-on-surface mb-6">Account Actions</h3>
          <div className="space-y-4">
            <button
              onClick={() => router.push("/dashboard/doctor")}
              className="w-full text-left p-4 rounded-2xl border border-outline-variant/10 hover:bg-surface-container-low transition"
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
              className="w-full text-left p-4 rounded-2xl border border-error/20 hover:bg-error/5 transition"
            >
              <span className="font-semibold text-error">Logout</span>
              <p className="text-sm text-on-surface-variant mt-1">Sign out of your account</p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
