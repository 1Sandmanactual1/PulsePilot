import { Session } from "@supabase/supabase-js";
import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";

import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { appStorage } from "@/lib/storage";

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  rememberEmail: boolean;
  savedEmail: string;
  signInWithEmail: (email: string, password: string, rememberEmail: boolean) => Promise<string | null>;
  signUpWithEmail: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const REMEMBER_EMAIL_KEY = "pulsepilot.remember-email";
const SAVED_EMAIL_KEY = "pulsepilot.saved-email";

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rememberEmail, setRememberEmail] = useState(true);
  const [savedEmail, setSavedEmail] = useState("");

  useEffect(() => {
    async function bootstrap() {
      const rememberValue = await appStorage.getItem(REMEMBER_EMAIL_KEY);
      const emailValue = await appStorage.getItem(SAVED_EMAIL_KEY);
      setRememberEmail(rememberValue !== "false");
      setSavedEmail(emailValue ?? "");

      if (!hasSupabaseEnv()) {
        setLoading(false);
        return;
      }

      const { data } = await supabase!.auth.getSession();
      setSession(data.session);
      setLoading(false);
    }

    bootstrap();

    if (!hasSupabaseEnv()) {
      return;
    }

    const { data: listener } = supabase!.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signInWithEmail(email: string, password: string, shouldRememberEmail: boolean) {
    if (!hasSupabaseEnv()) {
      return "Add your Supabase URL and publishable key in .env before using email sign-in.";
    }

    setLoading(true);
    setRememberEmail(shouldRememberEmail);
    setSavedEmail(shouldRememberEmail ? email : "");
    await appStorage.setItem(REMEMBER_EMAIL_KEY, shouldRememberEmail ? "true" : "false");

    if (shouldRememberEmail) {
      await appStorage.setItem(SAVED_EMAIL_KEY, email);
    } else {
      await appStorage.removeItem(SAVED_EMAIL_KEY);
    }

    const { error } = await supabase!.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);
    return error?.message ?? null;
  }

  async function signUpWithEmail(email: string, password: string) {
    if (!hasSupabaseEnv()) {
      return "Add your Supabase URL and publishable key in .env before using email sign-up.";
    }

    setLoading(true);
    const { error } = await supabase!.auth.signUp({
      email,
      password
    });
    setLoading(false);

    return error?.message ?? null;
  }

  async function signOut() {
    if (hasSupabaseEnv()) {
      await supabase!.auth.signOut();
    }
    setSession(null);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        rememberEmail,
        savedEmail,
        signInWithEmail,
        signUpWithEmail,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}
