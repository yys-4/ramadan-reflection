import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * Auth gate that wraps all protected routes.
 *
 * Critical design decision: we render a full-screen spinner during the auth
 * loading phase instead of immediately redirecting to /login. This prevents
 * a "flash-of-login-page" when the user has a valid persisted session that
 * hasn't hydrated yet (common on slow 3G mosque WiFi).
 *
 * The redirect uses `replace` to prevent the login page from appearing in
 * browser history — pressing "Back" after login won't loop back to /login.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
