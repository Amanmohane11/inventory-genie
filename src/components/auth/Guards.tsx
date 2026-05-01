import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store";
import type { Role } from "@/store/slices/authSlice";

export function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAppSelector((s) => s.auth.user);
  const loc = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return <>{children}</>;
}

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === "super_admin" ? "/admin" : "/"} replace />;
  }
  return <>{children}</>;
}

/** Redirect logged-in users away from /login to their home. */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const user = useAppSelector((s) => s.auth.user);
  if (user) {
    return <Navigate to={user.role === "super_admin" ? "/admin" : "/"} replace />;
  }
  return <>{children}</>;
}
