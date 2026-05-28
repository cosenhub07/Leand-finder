import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null);
  const [token,        setToken]        = useState(() => localStorage.getItem("lf_token"));
  const [authLoading,  setAuthLoading]  = useState(true);

  // Verify token on load
  useEffect(() => {
    if (!token) { setAuthLoading(false); return; }
    axios.get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setUser(r.data.user))
      .catch(() => { localStorage.removeItem("lf_token"); setToken(null); })
      .finally(() => setAuthLoading(false));
  }, [token]);

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem("lf_token", newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("lf_token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
