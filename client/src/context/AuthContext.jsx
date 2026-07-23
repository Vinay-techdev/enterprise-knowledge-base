import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      if (!localStorage.getItem("token")) return setLoading(false);
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
      } catch {
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const authenticate = async (endpoint, payload) => {
    const { data } = await api.post(endpoint, payload);
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    login: (payload) => authenticate("/auth/login", payload),
    register: (payload) => authenticate("/auth/register", payload),
    logout
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
