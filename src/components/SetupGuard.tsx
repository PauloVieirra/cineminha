import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { hasManager } from "../services/manager";
import { Setup } from "../pages/Setup";

/** /configurar só quando ainda não existe gestor; senão vai para login. */
export function SetupGuard() {
  const [ready, setReady] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);

  useEffect(() => {
    hasManager().then((exists) => {
      setHasAccount(exists);
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

  if (hasAccount) return <Navigate to="/gestor/login" replace />;

  return <Setup />;
}
