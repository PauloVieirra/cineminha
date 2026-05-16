import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { clearManagerSession, setManagerSession } from "../lib/auth";
import { supabase } from "../lib/supabase/client";

interface AuthContextValue {
  ready: boolean;
  session: Session | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  ready: false,
  session: null,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      if (s?.user?.id) setManagerSession(s.user.id);
      else clearManagerSession();
      setSession(s);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession?.user?.id) setManagerSession(nextSession.user.id);
      else clearManagerSession();
      setSession(nextSession);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      ready,
      session,
      isAuthenticated: Boolean(session?.user),
    }),
    [ready, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
