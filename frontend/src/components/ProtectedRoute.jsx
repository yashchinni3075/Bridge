import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();
  const token = localStorage.getItem('bridge_token');
  const user = JSON.parse(localStorage.getItem('bridge_user') || 'null');

  // 1. Not authenticated -> Redirect to login with return path
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role restriction check (if specific roles are required)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}