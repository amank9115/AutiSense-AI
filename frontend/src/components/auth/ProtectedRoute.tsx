"use client";
import type { ReactNode } from "react";
import { useAuth, type UserRole } from "../../context/AuthContext";
import { redirect } from "next/navigation";

const ProtectedRoute = ({ children, role }: { children: ReactNode; role?: UserRole }) => {
  const { user, isGuest } = useAuth();
  if (!user) redirect("/login");
  if (isGuest) return <>{children}</>;
  if (role && user.role !== role)
    redirect(user.role === "parent" ? "/dashboard/parent" : "/dashboard/doctor");
  return <>{children}</>;
};

export default ProtectedRoute;
