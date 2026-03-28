"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { UserProfile, UserRole } from "@/lib/types";

const PROFILES: Record<UserRole, UserProfile> = {
  mum: { id: "mel", name: "Mel", role: "mum", email: "", color: "#d946ef" },
  dad: { id: "andrew", name: "Andrew", role: "dad", email: "", color: "#0ea5e9" },
};

const STORAGE_KEY = "amesbury_user";

interface AuthContextValue {
  profile: UserProfile | null;
  loading: boolean;
  selectUser: (role: UserRole) => void;
  signOut: () => void;
  activeUser: UserRole;
  setActiveUser: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeUser, setActiveUser] = useState<UserRole>("mum");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as UserRole | null;
    if (saved && PROFILES[saved]) {
      setProfile(PROFILES[saved]);
      setActiveUser(saved);
    }
    setLoading(false);
  }, []);

  function selectUser(role: UserRole) {
    localStorage.setItem(STORAGE_KEY, role);
    setProfile(PROFILES[role]);
    setActiveUser(role);
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{ profile, loading, selectUser, signOut, activeUser, setActiveUser }}
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
