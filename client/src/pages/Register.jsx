import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { AuthLayout } from "./Login";

export default function Register() {
 const [form,setForm]=useState({name:"",email:"",password:"",organizationName:""}); const [submitting,setSubmitting]=useState(false); const {register}=useAuth(); const navigate=useNavigate();
 const submit=async(e)=>{e.preventDefault();setSubmitting(true);try{await register(form);toast.success("Workspace created successfully");navigate("/dashboard")}catch(error){toast.error(getErrorMessage(error,"Unable to register"))}finally{setSubmitting(false)}};
 return <AuthLayout><div className="mb-7"><div className="mb-5 inline-flex rounded-2xl bg-indigo-50 p-3 text-indigo-600"><Building2/></div><h1 className="text-3xl font-bold tracking-tight">Create a workspace</h1><p className="mt-2 text-sm leading-6 text-slate-500">The first account becomes the workspace owner and administrator.</p></div><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><Field label="Your name" value={form.name} set={(v)=>setForm({...form,name:v})}/><Field label="Organization" value={form.organizationName} set={(v)=>setForm({...form,organizationName:v})}/><div className="sm:col-span-2"><Field label="Work email" type="email" value={form.email} set={(v)=>setForm({...form,email:v})}/></div><div className="sm:col-span-2"><Field label="Password" type="password" value={form.password} set={(v)=>setForm({...form,password:v})} hint="At least 8 characters with a letter and number"/></div><button disabled={submitting} className="btn-primary sm:col-span-2 py-3">{submitting?"Creating workspace…":"Create workspace"}</button></form><p className="mt-6 text-center text-sm text-slate-500">Already registered? <Link className="font-semibold text-indigo-600" to="/login">Sign in</Link></p></AuthLayout>
}
function Field({label,type="text",value,set,hint}){return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span><input required minLength={type==="password"?8:2} type={type} value={value} onChange={(e)=>set(e.target.value)} className="input-premium"/>{hint&&<span className="mt-1.5 block text-xs text-slate-400">{hint}</span>}</label>}
