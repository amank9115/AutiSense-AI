"use client";

import React, { useState } from "react";
import { Navbar, Footer } from "@/components/layout/Navigation";
import { Button, Card, Input } from "@/components/ui/StitchUI";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/services/authApi";
import { useAppStore } from "@/store";

export default function SignupPage() {
  const [role, setRole] = useState<"parent" | "provider">("parent");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ token: string; email: string } | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const router = useRouter();
  const setAuth = useAppStore((state) => state.setAuth);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authApi.register({
        name,
        email,
        password,
        role: role === "provider" ? "doctor" : "parent",
      });

      // After registration, user needs to verify email
      // Show verification token so user can click to verify
      if (response.message && response.user) {
        setLoading(false);
        setSuccessData({
          token: response.verificationToken || "",
          email: email,
        });
        return;
      }

      // If no message, proceed normally (for backwards compatibility)
      if (response.user && response.access_token) {
        setAuth(response.user, response.access_token);

        if (response.user.role === "doctor") {
          router.push("/dashboard/doctor");
        } else {
          router.push("/dashboard/parent");
        }
      } else {
        setError("Registration succeeded but login failed. Please try logging in.");
        setLoading(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    try {
      const response = await authApi.resendVerification(email);
      if (response.verificationToken) {
        setSuccessData({ token: response.verificationToken, email });
      } else {
        setError(response.message || "Failed to resend.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend verification.");
    }
  };

  return (
    <div className="bg-surface min-h-screen text-on-surface font-body antialiased flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-8">
        <div className="max-w-[1440px] w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Visual Illustration Section */}
          <div className="hidden lg:flex flex-col items-start justify-center p-8 lg:p-12 relative h-full animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="absolute inset-0 z-0 opacity-30">
              <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-fixed via-transparent to-transparent blur-[120px]"></div>
            </div>
            <div className="relative z-10 space-y-8 lg:space-y-12">
              <div className="w-full aspect-video rounded-2xl lg:rounded-3xl overflow-hidden bg-surface-container-low shadow-2xl border-8 border-white group relative">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9cwobMulniCkL_iTHzZguL9_9h5cddmPQszvDOmHmlCIOldcJGs9IlhVegeC2YZOKNz2AGgwMx5kkXFxMmsELZ4ezImoE6xvEPO0KpKc7VT8Lz2KCte9CIUf699qXhzmBdVRGUZuQ6_HnFV5J88zEIp8YJjCgWJMZgUC7lsXuGgzsPDFvmTUHYRMxHUi3I1OQb61VzJSLUiFN9F2ZjXYUAcw1QA_q2Jf1hRjN1W-rngDOFYwFKtn1eGUivChKvHGP6WOrC2ZCzfc"
                  alt="Tranquil Sanctuary"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-[2s]"
                  priority
                />
              </div>
              <div className="space-y-4 lg:space-y-6">
                <h2 className="font-headline font-extrabold text-3xl lg:text-5xl text-primary tracking-tighter leading-tight">Begin your journey with a gentle first step.</h2>
                <p className="text-base lg:text-xl text-on-surface-variant leading-relaxed max-w-xl font-medium opacity-80">
                  Join thousands of families and providers who have found clarity and support through our sensory-friendly platform.
                </p>
              </div>
            </div>
          </div>

          {/* Signup Form Section */}
          <div className="w-full flex justify-center lg:justify-start">
            <Card className="w-full max-w-lg p-8 sm:p-10 lg:p-16 rounded-2xl lg:rounded-[3rem] border-none shadow-2xl bg-white/80 backdrop-blur-xl relative overflow-hidden">
              <div className="text-center mb-8 lg:mb-12">
                <h1 className="font-headline font-extrabold text-3xl lg:text-4xl text-primary mb-3 tracking-tight">Create Account</h1>
                <p className="text-sm lg:text-on-surface-variant font-medium opacity-60">Start your journey with MannSaathi today.</p>
              </div>

              {/* Role Toggle */}
              <div className="bg-surface-container-high p-1.5 sm:p-2 rounded-full flex mb-8 lg:mb-12 shadow-inner relative">
                <div
                  className="absolute top-1.5 sm:top-2 bottom-1.5 sm:bottom-2 w-[calc(50%-6px)] bg-white rounded-full shadow-xl transition-all duration-500 ease-out"
                  style={{
                    left: role === "parent" ? "4px" : "calc(50% + 2px)",
                    backgroundColor: role === "parent" ? "#3e684a" : "#176876",
                    transition: "left 500ms ease-out, background-color 500ms ease-out",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setRole("parent")}
                  className="flex-1 py-3 sm:py-4 rounded-full text-xs font-extrabold uppercase tracking-widest relative z-10"
                >
                  <span className={role === "parent" ? "text-white font-bold" : "text-[#5e605b]"}>Parent</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("provider")}
                  className="flex-1 py-3 sm:py-4 rounded-full text-xs font-extrabold uppercase tracking-widest relative z-10"
                >
                  <span className={role === "provider" ? "text-white font-bold" : "text-[#5e605b]"}>Doctor</span>
                </button>
              </div>

              {/* Form */}
              <form className="space-y-6 lg:space-y-8" onSubmit={handleSignup}>
                {error && (
                  <div className="bg-error/10 border border-error/20 text-error text-xs font-bold p-4 rounded-2xl animate-in fade-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                {successData && (
                  <div className="bg-success/10 border border-success/20 p-6 rounded-2xl animate-in fade-in slide-in-from-top-2 text-center">
                    <div className="flex flex-col items-center gap-3 mb-2">
                      <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-2 animate-bounce">
                        <span className="material-symbols-outlined text-4xl text-success" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
                      </div>
                      <div>
                        <h3 className="text-xl text-success font-extrabold mb-2">Check your email</h3>
                        <p className="text-success/80 text-sm font-medium">
                          We&apos;ve sent a magic link to <strong className="text-success">{successData.email}</strong>.
                          <br/><br/>
                          Click the link in the email to verify your account and log in automatically.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResend}
                      className="w-full mt-4 bg-white border border-success/30 text-success py-3 rounded-xl font-bold hover:bg-success/5 transition-all text-sm flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-base">forward_to_inbox</span>
                      Resend Verification Link
                    </button>
                  </div>
                )}

                {!successData && (
                <div className="space-y-2 sm:space-y-3">
                  <label className="font-headline font-extrabold text-xs px-4 sm:px-6 text-on-surface uppercase tracking-widest opacity-60" htmlFor="name">Full Name</label>
                  <Input
                    className="w-full px-6 sm:px-8 py-4 sm:py-5 rounded-full bg-surface-container-highest border-none focus:ring-4 focus:ring-primary/5 shadow-inner"
                    id="name"
                    placeholder="John Doe"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                )}

                {!successData && (
                <div className="space-y-2 sm:space-y-3">
                  <label className="font-headline font-extrabold text-xs px-4 sm:px-6 text-on-surface uppercase tracking-widest opacity-60" htmlFor="email">Email Address</label>
                  <Input
                    className="w-full px-6 sm:px-8 py-4 sm:py-5 rounded-full bg-surface-container-highest border-none focus:ring-4 focus:ring-primary/5 shadow-inner"
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                )}

                {!successData && (
                <div className="space-y-2 sm:space-y-3">
                  <label className="font-headline font-extrabold text-xs px-4 sm:px-6 text-on-surface uppercase tracking-widest opacity-60" htmlFor="password">Password</label>
                  <div className="relative">
                    <Input
                      className="w-full px-6 sm:px-8 py-4 sm:py-5 rounded-full bg-surface-container-highest border-none focus:ring-4 focus:ring-primary/5 shadow-inner"
                      id="password"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                  <div className="text-xs text-on-surface-variant px-4 sm:px-6 space-y-1">
                    <p className="font-bold mb-2">Password must have:</p>
                    <ul className="space-y-1">
                      <li className={password.length >= 8 ? "text-emerald-600 font-bold" : "opacity-50"}>
                        • At least 8 characters
                      </li>
                      <li className={/[A-Z]/.test(password) ? "text-emerald-600 font-bold" : "opacity-50"}>
                        • One uppercase letter
                      </li>
                      <li className={/[a-z]/.test(password) ? "text-emerald-600 font-bold" : "opacity-50"}>
                        • One lowercase letter
                      </li>
                      <li className={/\d/.test(password) ? "text-emerald-600 font-bold" : "opacity-50"}>
                        • One number
                      </li>
                      <li className={/[^a-zA-Z\d]/.test(password) ? "text-emerald-600 font-bold" : "opacity-50"}>
                        • One special character
                      </li>
                    </ul>
                  </div>
                </div>
                )}

                {!successData && (
                <div className="space-y-2 sm:space-y-3">
                  <label className="font-headline font-extrabold text-xs px-4 sm:px-6 text-on-surface uppercase tracking-widest opacity-60" htmlFor="confirmPassword">Confirm Password</label>
                  <div className="relative">
                    <Input
                      className="w-full px-6 sm:px-8 py-4 sm:py-5 rounded-full bg-surface-container-highest border-none focus:ring-4 focus:ring-primary/5 shadow-inner"
                      id="confirmPassword"
                      placeholder="••••••••"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined">{showConfirmPassword ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                </div>
                )}

                {!successData && (
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 sm:py-6 rounded-full text-base lg:text-lg font-extrabold shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all mt-4 sm:mt-6 uppercase tracking-[0.2em]"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
                )}
              </form>

              <div className="mt-10 sm:mt-16 pt-8 sm:pt-10 text-center border-t border-surface-container-high/50">
                <p className="text-sm text-on-surface-variant font-medium">
                  Already have an account?
                  <Link href="/login" className="font-extrabold text-secondary hover:underline ml-2 uppercase tracking-widest text-[10px]">
                    Sign In
                  </Link>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
