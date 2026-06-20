"use client";
import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type UserRole } from "../../context/AuthContext";

const ProtectedRoute = ({
  children,
  role,
}: {
  children: ReactNode;
  role?: UserRole;
}) => {
  const { user, isGuest } = useAuth();
  const router = useRouter();
  // Guard against acting on the store before client-side hydration, otherwise
  // an authenticated user is briefly seen as logged-out and bounced to /login.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isGuest) return;
    if (!user) {
      router.replace("/login");
    } else if (role && user.role !== role) {
      router.replace(
        user.role === "parent" ? "/dashboard/parent" : "/dashboard/doctor",
      );
    }
  }, [mounted, user, isGuest, role, router]);

  if (isGuest) return <>{children}</>;
  if (!mounted || !user) return null;
  if (role && user.role !== role) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
