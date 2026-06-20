"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/StitchUI";
import { FormField } from "@/components/ui/FormField";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { PasswordStrengthIndicator } from "@/components/ui/PasswordStrengthIndicator";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/services/authApi";
import { useAppStore } from "@/store";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[a-z]/, "Must include a lowercase letter")
    .regex(/\d/, "Must include a number")
    .regex(/[^A-Za-z0-9]/, "Must include a special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [role, setRole] = useState<"parent" | "provider">("parent");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ email: string } | null>(null);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const router = useRouter();
  const setAuth = useAppStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) });

  const passwordValue = watch("password") ?? "";

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);
    try {
      const response = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        role: role === "provider" ? "doctor" : "parent",
      });

      if (response.message && response.user) {
        setSuccessData({ email: data.email });
        return;
      }
      if (response.user && response.access_token) {
        setAuth(response.user, response.access_token);
        router.push(response.user.role === "doctor" ? "/dashboard/doctor" : "/dashboard/parent");
      } else {
        setServerError("Registration succeeded but login failed. Please try signing in.");
      }
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Failed to create account. Please try again.");
    }
  };

  const handleResend = async () => {
    if (!successData?.email || resendStatus === "sending") return;
    setResendStatus("sending");
    try {
      await authApi.resendVerification(successData.email);
      setResendStatus("sent");
    } catch {
      setResendStatus("error");
    }
  };

  return (
    <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

      {/* Visual illustration */}
      <div className="hidden lg:flex flex-col items-start justify-center">
        <div className="w-full aspect-video rounded-3xl overflow-hidden bg-surface-container-low shadow-2xl border-4 border-white relative">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9cwobMulniCkL_iTHzZguL9_9h5cddmPQszvDOmHmlCIOldcJGs9IlhVegeC2YZOKNz2AGgwMx5kkXFxMmsELZ4ezImoE6xvEPO0KpKc7VT8Lz2KCte9CIUf699qXhzmBdVRGUZuQ6_HnFV5J88zEIp8YJjCgWJMZgUC7lsXuGgzsPDFvmTUHYRMxHUi3I1OQb61VzJSLUiFN9F2ZjXYUAcw1QA_q2Jf1hRjN1W-rngDOFYwFKtn1eGUivChKvHGP6WOrC2ZCzfc"
            alt="Tranquil Sanctuary"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="mt-8 space-y-3">
          <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tighter leading-tight">
            Begin your journey with a gentle first step.
          </h2>
          <p className="text-on-surface-muted leading-relaxed">
            Join thousands of families and providers who found clarity through our sensory-friendly platform.
          </p>
        </div>
      </div>

      {/* Signup form */}
      <div className="w-full flex justify-center">
        <Card className="w-full max-w-md p-8 lg:p-10 rounded-3xl border-none shadow-2xl bg-white/85 backdrop-blur-xl">
          <div className="text-center mb-6">
            <h1 className="font-headline font-extrabold text-3xl text-primary mb-2 tracking-tight">Create Account</h1>
            <p className="text-sm text-on-surface-muted">Start your journey with MannSaathi today.</p>
          </div>

          {/* Role toggle */}
          <div className="bg-surface-container-high rounded-full flex p-1.5 mb-6 relative">
            <div
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-4px)] rounded-full shadow-md transition-all duration-300"
              style={{
                left: role === "parent" ? "6px" : "calc(50% + 2px)",
                backgroundColor: role === "parent" ? "#3e684a" : "#176876",
              }}
            />
            {(["parent", "provider"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className="flex-1 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-widest relative z-10 transition-colors"
                style={{ color: role === r ? "white" : "#5e605b" }}
              >
                {r === "parent" ? "Parent" : "Doctor"}
              </button>
            ))}
          </div>

          {successData ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-4xl text-success" style={{ fontVariationSettings: "'FILL' 1" }}>mark_email_read</span>
              </div>
              <h3 className="font-headline font-bold text-xl text-success">Check your email</h3>
              <p className="text-sm text-on-surface-muted">
                We&apos;ve sent a verification link to <strong className="text-on-surface">{successData.email}</strong>.
                Click the link to activate your account.
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendStatus === "sending"}
                className="w-full mt-2 border border-success/30 text-success py-3 rounded-2xl font-bold hover:bg-success/5 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-base">forward_to_inbox</span>
                {resendStatus === "sending" ? "Sending…" : "Resend Verification Link"}
              </button>
              {resendStatus === "sent" && (
                <p className="text-xs text-success font-semibold text-center">Verification email resent — check your inbox.</p>
              )}
              {resendStatus === "error" && (
                <p className="text-xs text-error font-semibold text-center">Failed to resend. Please try again in a moment.</p>
              )}
              <Link href="/login" className="block text-sm font-semibold text-primary hover:underline mt-2">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} aria-busy={isSubmitting} noValidate>
              {serverError && (
                <div className="bg-error/8 border border-error/15 text-error text-xs font-semibold p-3 rounded-2xl" role="alert">
                  {serverError}
                </div>
              )}

              <FormField label="Full Name" id="name" error={errors.name?.message}>
                <input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  autoComplete="name"
                  className="w-full px-5 py-3.5 rounded-full bg-surface-container-highest border-none focus:ring-2 focus:ring-primary/20 font-body transition-all focus-visible:outline-none text-on-surface placeholder:text-on-surface-muted"
                  {...register("name")}
                />
              </FormField>

              <FormField label="Email Address" id="email" error={errors.email?.message}>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="w-full px-5 py-3.5 rounded-full bg-surface-container-highest border-none focus:ring-2 focus:ring-primary/20 font-body transition-all focus-visible:outline-none text-on-surface placeholder:text-on-surface-muted"
                  {...register("email")}
                />
              </FormField>

              <FormField label="Password" id="password" error={errors.password?.message}>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full px-5 py-3.5 pr-12 rounded-full bg-surface-container-highest border-none focus:ring-2 focus:ring-primary/20 font-body transition-all focus-visible:outline-none text-on-surface"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                <PasswordStrengthIndicator value={passwordValue} />
              </FormField>

              <FormField label="Confirm Password" id="confirmPassword" error={errors.confirmPassword?.message}>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full px-5 py-3.5 pr-12 rounded-full bg-surface-container-highest border-none focus:ring-2 focus:ring-primary/20 font-body transition-all focus-visible:outline-none text-on-surface"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined text-xl">{showConfirm ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </FormField>

              <LoadingButton
                type="submit"
                variant="primary"
                loading={isSubmitting}
                loadingText="Creating Account…"
                className="w-full py-4 rounded-full font-extrabold shadow-lg shadow-primary/15 hover:scale-[1.02] active:scale-[0.98] mt-2 uppercase tracking-[0.15em]"
              >
                Create Account
              </LoadingButton>
            </form>
          )}

          {!successData && (
            <div className="mt-6 pt-5 text-center border-t border-surface-container-high/50">
              <p className="text-sm text-on-surface-muted">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-secondary hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          )}
        </Card>
      </div>

    </div>
  );
}
