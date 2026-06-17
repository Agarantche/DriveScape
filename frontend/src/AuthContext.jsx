/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const notConfigured = () => Promise.reject(new Error("Supabase isn't configured yet — add your keys to frontend/.env."));

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    isSupabaseConfigured,
    signUp: (email, password) => (supabase ? supabase.auth.signUp({ email, password }) : notConfigured()),
    signIn: (email, password) => (supabase ? supabase.auth.signInWithPassword({ email, password }) : notConfigured()),
    signOut: () => (supabase ? supabase.auth.signOut() : Promise.resolve()),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
