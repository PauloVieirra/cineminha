import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { clearManagerSession, setManagerSession } from "../lib/auth";
import { supabase } from "../lib/supabase/client";

export function ManagerGuard() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id;
      if (uid) {
        setManagerSession(uid);
        setAuthed(true);
      } else {
        clearManagerSession();
        setAuthed(false);
      }
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) {
        setManagerSession(session.user.id);
        setAuthed(true);
      } else {
        clearManagerSession();
        setAuthed(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <div className="gradient-mesh flex min-h-dvh items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (!authed) return <Navigate to="/entrar" replace />;

  return <Outlet />;
}
