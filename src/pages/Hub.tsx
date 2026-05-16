import { Navigate } from "react-router-dom";

/** @deprecated Use LandingPage (`/`) e ProfilesPage (`/perfis`). */
export function Hub() {
  return <Navigate to="/" replace />;
}
