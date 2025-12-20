import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getSession } from "@/lib/auth-storage";

const AdminRoute = ({ children }) => {
  const { user, token, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth state is being determined
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner text-primary" />
      </div>
    );
  }

  // Double-check: also verify localStorage session exists
  const storedSession = getSession();
  const hasValidSession = isAuthenticated && token && storedSession?.accessToken;

  // Redirect to admin login if not authenticated or no valid session
  if (!hasValidSession) {
    return <Navigate to="/admin/login" state={{ redirectTo: location.pathname }} replace />;
  }

  // Only admins can access admin routes
  if (user?.role !== "ADMIN") {
    return <Navigate to={user?.role === "CLIENT" ? "/client" : "/freelancer"} replace />;
  }

  return children;
};

export default AdminRoute;

