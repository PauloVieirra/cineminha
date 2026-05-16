import { Navigate, Outlet } from "react-router-dom";
import { isGestorUnlocked } from "../lib/gestor-access";

export function GestorUnlockedGuard() {
  if (!isGestorUnlocked()) {
    return <Navigate to="/perfis" replace />;
  }
  return <Outlet />;
}
