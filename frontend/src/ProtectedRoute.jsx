import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

// Gates /app behind login. Until Supabase is configured, the app stays open so it's
// usable during setup; once keys are added, this enforces a real session.
export default function ProtectedRoute({ children }) {
  const { user, loading, isSupabaseConfigured } = useAuth();
  if (!isSupabaseConfigured) return children;
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
