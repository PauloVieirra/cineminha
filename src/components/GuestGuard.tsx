import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/** Redireciona usuários já autenticados para a seleção de perfis. */
export function GuestGuard() {
  const { ready, isAuthenticated } = useAuth();

  if (!ready) {
    return (
      <div className="gradient-mesh flex min-h-dvh items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/perfis" replace />;

  return <Outlet />;
}
