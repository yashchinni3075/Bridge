import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();
  const token = localStorage.getItem('bridge_token');
  const user = JSON.parse(localStorage.getItem('bridge_user') || 'null');

  // Debug logging
  console.log('[ProtectedRoute] Check:', { 
    path: location.pathname, 
    hasToken: !!token, 
    userRole: user?.role, 
    allowedRoles,
    roleMatch: allowedRoles ? allowedRoles.includes(user?.role) : true
  });

  // 1. Not authenticated -> Redirect to login with return path
  if (!token || !user) {
    console.log('[ProtectedRoute] No token or user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Authenticated but wrong role -> 403 Forbidden (not a redirect home,
  //    which silently hid the fact that the page exists but is off-limits).
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('[ProtectedRoute] Role mismatch, showing 403');
    return (
      <Navigate
        to="/403"
        state={{
          allowedRoles,
          actualRole: user.role,
          from: location.pathname,
        }}
        replace
      />
    );
  }

  return <Outlet />;
}