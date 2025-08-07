import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/auth-context";

function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null; // or <LoadingSpinner />

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default ProtectedRoute;
