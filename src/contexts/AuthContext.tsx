import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provides authentication state and actions to the entire component tree.
 *
 * Architecture note: We register `onAuthStateChange` BEFORE calling `getSession()`
 * to avoid a race condition where a token refresh completes between the getSession
 * call and the listener setup — which would leave the app in a stale auth state.
 * The listener covers all real-time auth events (sign-in, sign-out, token refresh),
 * while getSession() provides the initial hydration on cold start.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Step 1: Subscribe to auth events first (prevents race conditions)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Step 2: Hydrate initial session from persisted storage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    toast({ title: "Welcome back! 🌙", description: "Assalamualaikum" });
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // `full_name` is passed as user metadata so the `handle_new_user()` trigger
    // can auto-populate the profiles table without a separate API call.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    toast({ title: "Account created! ✨", description: "Please check your email to verify your account." });
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
  );
}

/**
 * Hook to consume auth state. Throws if used outside AuthProvider to fail fast
 * during development — this avoids silent null states that would cause confusing
 * bugs deeper in the component tree.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
