import { LoaderCircle } from "lucide-react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-300"><div className="text-center"><LoaderCircle className="mx-auto animate-spin text-indigo-400" size={30}/><p className="mt-3 text-sm">Loading your workspace…</p></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
