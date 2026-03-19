import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "../api/client";

const AUTH_TOKEN_KEY = "auth_token";

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  authHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() =>
    localStorage.getItem(AUTH_TOKEN_KEY)
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const setToken = useCallback((t: string | null) => {
    if (t) {
      localStorage.setItem(AUTH_TOKEN_KEY, t);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
    setTokenState(t);
  }, []);

  const fetchUser = useCallback(
    async (t: string) => {
      try {
        const res = await apiFetch("/api/v1/auth/me", {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (!res.ok) {
          setToken(null);
          setUser(null);
          return;
        }
        const data = await res.json();
        setUser({ id: data.id, email: data.email, role: data.role ?? "student" });
      } catch {
        setToken(null);
        setUser(null);
      }
    },
    [setToken]
  );

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    fetchUser(token).finally(() => setLoading(false));
  }, [token, fetchUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail ?? "Login failed");
      }
      const data = await res.json();
      setToken(data.access_token);
      setUser({ id: data.user_id, email, role: data.role ?? "student" });
    },
    [setToken]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail ?? "Registration failed");
      }
      const data = await res.json();
      setToken(data.access_token);
      setUser({ id: data.user_id, email, role: data.role ?? "student" });
    },
    [setToken]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, [setToken]);

  const authHeaders = useCallback(
    (): Record<string, string> => {
      if (!token) return {};
      return { Authorization: `Bearer ${token}` };
    },
    [token]
  );

  return (
    <AuthContext.Provider
      value={{ token, user, loading, login, register, logout, authHeaders }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
