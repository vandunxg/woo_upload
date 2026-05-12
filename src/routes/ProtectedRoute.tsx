import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuthStore } from "@/store/authStore";
import { useSiteStore } from "@/store/siteStore";

export default function ProtectedRoute() {
  const activeSiteId = useSiteStore((state) => state.activeSiteId);
  const clearExpiredSessions = useAuthStore(
    (state) => state.clearExpiredSessions,
  );
  const hasValidSession = useAuthStore((state) =>
    state.hasValidSession(activeSiteId),
  );

  useEffect(() => {
    clearExpiredSessions();
  }, [clearExpiredSessions]);

  if (!activeSiteId || !hasValidSession) {
    return <Navigate replace to="/login" />;
  }

  return <Outlet />;
}
