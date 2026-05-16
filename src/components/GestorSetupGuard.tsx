import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { hasManager } from "../services/manager";

/** Só nas rotas do gestor: exige conta criada antes de login/painel. */
export function GestorSetupGuard() {
  const [ready, setReady] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    hasManager().then((exists) => {
      setNeedsSetup(!exists);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div className="gradient-mesh flex min-h-dvh items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (needsSetup) return <Navigate to="/configurar" replace />;

  return <Outlet />;
}
