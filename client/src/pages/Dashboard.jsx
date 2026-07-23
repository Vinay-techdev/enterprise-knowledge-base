import { useEffect, useState } from "react";
import { ArrowRight, FileText, HardDrive, ShieldCheck, Sparkles, Upload, Users } from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

const formatBytes = (bytes = 0) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};
const formatDate = (value) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  const load = async () => {
    setFailed(false);
    try { const response = await api.get("/dashboard"); setData(response.data); }
    catch (error) { setFailed(true); toast.error(getErrorMessage(error, "Could not load dashboard")); }
  };
  useEffect(() => { load(); }, []);

  const cards = [
    { label: "Documents", value: data?.stats.totalDocuments ?? "—", icon: FileText, note: "Knowledge files" },
    { label: "Active members", value: data ? `${data.stats.activeUsers}/${data.stats.totalUsers}` : "—", icon: Users, note: "Workspace access" },
    { label: "Storage used", value: data ? formatBytes(data.stats.storageUsed) : "—", icon: HardDrive, note: "Local storage" },
    { label: "Workspace plan", value: data?.stats.plan || "—", icon: ShieldCheck, note: "Current subscription" }
  ];

  return <Page>
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-7 text-white shadow-2xl shadow-indigo-950/20 lg:p-9">
      <div className="relative z-10 max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur"><Sparkles size={14}/> Enterprise intelligence workspace</span><p className="mt-6 text-sm font-medium text-indigo-100">{user?.organization?.name || "Organization workspace"}</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Welcome back, {user?.name?.split(" ")[0]}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">Manage your organization’s knowledge, access activity, and prepare documents for intelligent retrieval.</p><div className="mt-6 flex flex-wrap gap-3"><Link to="/documents" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-lg shadow-indigo-950/20 transition hover:-translate-y-0.5"><Upload size={17}/>Upload document</Link>{user?.role === "admin" && <Link to="/admin/users" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"><Users size={17}/>Manage team</Link>}</div></div>
    </section>

    {failed ? <ErrorPanel retry={load}/> : <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon, note }) => <div key={label} className="card-premium group p-5"><div className="flex items-start justify-between"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 transition group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white"><Icon size={20}/></div><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]"/></div><p className="mt-5 text-2xl font-bold capitalize tracking-tight">{value}</p><p className="mt-1 text-sm font-medium text-slate-600">{label}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>)}</div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2"><Panel title="Recent documents" action={<Link to="/documents" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">View all <ArrowRight size={15}/></Link>}>{!data ? <SkeletonRows/> : data.recentDocuments.length === 0 ? <Empty icon={FileText} text="No documents uploaded yet."/> : data.recentDocuments.map((document) => <div key={document._id} className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 last:border-0"><div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><FileText size={18}/></div><div className="min-w-0"><p className="truncate font-semibold text-slate-800">{document.title}</p><p className="text-xs text-slate-500">By {document.uploadedBy?.name || "Unknown"}</p></div></div><span className="shrink-0 text-xs text-slate-400">{formatDate(document.createdAt)}</span></div>)}</Panel>
      <Panel title="Recent activity">{!data ? <SkeletonRows/> : data.recentActivity.length === 0 ? <Empty icon={ShieldCheck} text="Activity will appear after document actions."/> : data.recentActivity.map((activity) => <div key={activity._id} className="flex gap-3 border-b border-slate-100 px-5 py-4 last:border-0"><div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.1)]"/><div><p className="text-sm font-medium text-slate-700">{activity.description}</p><p className="mt-1 text-xs text-slate-400">{formatDate(activity.createdAt)}</p></div></div>)}</Panel></div>
    </>}
  </Page>;
}

const Page = ({ children }) => <div className="relative mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-10">{children}</div>;
const Panel = ({ title, action, children }) => <section className="card-premium overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-bold tracking-tight text-slate-800">{title}</h2>{action}</div>{children}</section>;
const Empty = ({ icon: Icon, text }) => <div className="grid place-items-center px-6 py-12 text-center"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Icon size={21}/></div><p className="mt-3 text-sm text-slate-500">{text}</p></div>;
const SkeletonRows = () => <div className="animate-pulse space-y-4 p-5">{[1,2,3].map(i=><div key={i} className="flex gap-3"><div className="h-10 w-10 rounded-xl bg-slate-100"/><div className="flex-1"><div className="h-3 w-1/2 rounded bg-slate-100"/><div className="mt-2 h-2.5 w-1/3 rounded bg-slate-100"/></div></div>)}</div>;
const ErrorPanel = ({ retry }) => <div className="card-premium mt-6 p-8 text-center"><p className="font-semibold text-slate-800">Dashboard data could not be loaded.</p><p className="mt-1 text-sm text-slate-500">Check the backend connection and try again.</p><button onClick={retry} className="btn-primary mt-4">Retry</button></div>;
