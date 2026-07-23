import { BookOpen, FileText, LayoutDashboard, LogOut, Menu, ShieldCheck, Users, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppShell() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const nav = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/documents", label: "Documents", icon: FileText },
    ...(user?.role === "admin" ? [{ to: "/admin/users", label: "Team members", icon: Users }] : [])
  ];

  const signOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.15),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_24%)]" />
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-slate-950/85 px-4 text-white backdrop-blur-xl md:hidden">
        <Brand compact />
        <button onClick={() => setOpen(true)} className="rounded-xl border border-white/10 bg-white/5 p-2.5" aria-label="Open navigation"><Menu size={20}/></button>
      </header>

      {open && <button className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} aria-label="Close navigation overlay" />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-white/10 bg-slate-950/95 p-5 text-white backdrop-blur-xl transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between"><Brand/><button onClick={() => setOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 md:hidden"><X size={20}/></button></div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300">Workspace</p>
          <p className="mt-2 truncate font-semibold">{user?.organization?.name || "Organization"}</p>
          <p className="mt-1 text-xs text-slate-400">Secure enterprise intelligence</p>
        </div>
        <nav className="mt-7 space-y-1.5">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition ${isActive ? "bg-indigo-500 text-white shadow-lg shadow-indigo-950/30" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}>
              <Icon size={18} className="transition group-hover:scale-105"/>{label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 font-bold">{user?.name?.charAt(0)?.toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{user?.name}</p><p className="truncate text-xs text-slate-400">{user?.email}</p></div></div>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3"><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium capitalize text-emerald-300"><ShieldCheck size={13}/>{user?.role}</span><button onClick={signOut} className="rounded-xl p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-300" aria-label="Log out"><LogOut size={17}/></button></div>
        </div>
      </aside>
      <main key={location.pathname} className="relative min-h-screen md:ml-72"><Outlet /></main>
    </div>
  );
}

function Brand({ compact = false }) {
  return <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-400 via-indigo-500 to-violet-600 shadow-lg shadow-indigo-950/30"><BookOpen size={21}/></div>{!compact && <div><p className="font-bold tracking-tight">KnowledgeBase AI</p><p className="text-[11px] text-slate-400">Enterprise workspace</p></div>}</div>;
}
