"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/StitchUI";
import { FormField } from "@/components/ui/FormField";
import { LoadingButton } from "@/components/ui/LoadingButton";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/services/authApi";
import { useAppStore } from "@/store";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAppStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const verified = searchParams?.get("verified");
    if (verified === "false") {
      const storedEmail = localStorage.getItem("pendingVerificationEmail");
      if (storedEmail) setPendingEmail(storedEmail);
      setServerError("Account created! Please check your email to verify your account before logging in.");
    }
  }, [searchParams]);

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const response = await authApi.login(data.email, data.password);
      if (!response.user || !response.access_token) {
        setServerError("Login failed. Please try again.");
        return;
      }
      setAuth(response.user, response.access_token);
      router.push(response.user.role === "doctor" ? "/dashboard/doctor" : "/dashboard/parent");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in. Please check your credentials.";
      // Show email not verified state so user can resend
      if (msg.toLowerCase().includes("verif") || msg.toLowerCase().includes("not verified")) {
        setPendingEmail(data.email);
        setServerError("Please verify your email before signing in. Check your inbox or resend below.");
      } else {
        setServerError(msg);
      }
    }
  };

  const handleResendVerification = async () => {
    const email = pendingEmail || getValues("email");
    if (!email) { setServerError("Please enter your email address first."); return; }
    setResending(true);
    try {
      const response = await authApi.resendVerification(email);
      setVerificationSent(true);
      setServerError(response.message ?? "Verification email sent!");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Failed to resend verification email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

      {/* Visual illustration — left side */}
      <div className="hidden lg:flex flex-col items-start justify-center relative">
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
            Your child&apos;s progress starts with a calm first step.
          </h2>
          <p className="text-on-surface-muted leading-relaxed">
            Navigate your journey with clarity, supported by tools built for sensory comfort.
          </p>
        </div>
      </div>

      {/* Login form */}
      <div className="w-full flex justify-center">
        <Card className="w-full max-w-md p-8 lg:p-10 rounded-3xl border-none shadow-2xl bg-white/85 backdrop-blur-xl">
          <div className="text-center mb-8">
            <h1 className="font-headline font-extrabold text-3xl text-primary mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-sm text-on-surface-muted">Sign in to access your navigator dashboard.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} aria-busy={isSubmitting} noValidate>
            {serverError && (
              <div className="bg-error/8 border border-error/15 text-error text-xs font-semibold p-4 rounded-2xl" role="alert">
                {serverError}
              </div>
            )}

            {pendingEmail && (
              <div className="text-center space-y-2 p-4 bg-success/8 border border-success/15 rounded-2xl">
                <p className="text-success text-sm font-bold">Check your email to verify your account.</p>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending || verificationSent}
                  className="text-primary text-xs font-bold hover:underline disabled:opacity-50"
                >
                  {verificationSent ? "Email sent!" : resending ? "Sending..." : "Didn't receive it? Resend"}
                </button>
              </div>
            )}

            <FormField label="Email Address" id="email" error={errors.email?.message}>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                className="w-full px-5 py-3.5 rounded-full bg-surface-container-highest border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-bright font-body transition-all focus-visible:outline-none text-on-surface placeholder:text-on-surface-muted"
                {...register("email")}
              />
            </FormField>

            <FormField label="Password" id="password" error={errors.password?.message}>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-5 py-3.5 pr-12 rounded-full bg-surface-container-highest border-none focus:ring-2 focus:ring-primary/20 focus:bg-surface-bright font-body transition-all focus-visible:outline-none text-on-surface"
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
              <div className="flex justify-end mt-1">
                <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>
            </FormField>

            <LoadingButton
              type="submit"
              variant="primary"
              loading={isSubmitting}
              loadingText="Signing in…"
              className="w-full py-4 rounded-full font-extrabold shadow-lg shadow-primary/15 hover:scale-[1.02] active:scale-[0.98] mt-2 uppercase tracking-[0.15em]"
            >
              Sign In
            </LoadingButton>
          </form>

          <div className="mt-8 pt-6 text-center border-t border-surface-container-high/50">
            <p className="text-sm text-on-surface-muted">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-bold text-secondary hover:underline">
                Get Started
              </Link>
            </p>
          </div>
        </Card>
      </div>

    </div>
  );
}
