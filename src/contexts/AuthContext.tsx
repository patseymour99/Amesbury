"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile, setUserProfile } from "@/lib/firestore";
import type { UserProfile, UserRole } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  activeUser: UserRole;
  setActiveUser: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEFAULT_PROFILES: Record<string, Omit<UserProfile, "id">> = {
  mum: {
    name: "Mum",
    role: "mum",
    email: "",
    color: "#d946ef",
  },
  dad: {
    name: "Dad",
    role: "dad",
    email: "",
    color: "#0ea5e9",
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState<UserRole>("mum");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        let p = await getUserProfile(firebaseUser.uid);
        if (!p) {
          const role = firebaseUser.email?.includes("dad") ? "dad" : "mum";
          const defaults = DEFAULT_PROFILES[role];
          const newProfile = { ...defaults, email: firebaseUser.email || "" };
          await setUserProfile(firebaseUser.uid, newProfile);
          p = { id: firebaseUser.uid, ...newProfile };
        }
        setProfile(p);
        setActiveUser(p.role);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signOut() {
    await firebaseSignOut(auth);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signOut, activeUser, setActiveUser }}
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
