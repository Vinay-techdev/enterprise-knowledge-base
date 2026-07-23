import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminUsers from "./pages/AdminUsers";
import Documents from "./pages/Documents";

export default function App(){return <><Toaster position="top-right" toastOptions={{duration:3500,style:{borderRadius:"14px",background:"#0f172a",color:"#fff",boxShadow:"0 18px 45px rgba(2,6,23,.25)"}}}/><Routes><Route path="/" element={<Navigate to="/dashboard" replace/>}/><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/><Route element={<ProtectedRoute/>}><Route element={<AppShell/>}><Route path="/dashboard" element={<Dashboard/>}/><Route path="/documents" element={<Documents/>}/><Route element={<ProtectedRoute roles={["admin"]}/> }><Route path="/admin/users" element={<AdminUsers/>}/></Route></Route></Route><Route path="*" element={<Navigate to="/dashboard" replace/>}/></Routes></>}
