import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import api from '../services/api';

export default function ProtectedAdminRoute() {
  const location = useLocation();
  const [authState, setAuthState] = useState({
    loading: true,
    authenticated: false,
    isAdmin: false,
    blocked: false,
    role: null,
  });

  useEffect(() => {
    const verifyAdmin = async () => {
      const token = localStorage.getItem('bridge_token');
      if (!token) {
        setAuthState({ loading: false, authenticated: false, isAdmin: false, blocked: false, role: null });
        return;
      }
      try {
        const res = await api.get('/auth/me');
        const user = res.data?.user;
        const authenticated = Boolean(res.data?.success && user);
        setAuthState({
          loading: false,
          authenticated,
          isAdmin: authenticated && user.role === 'admin' && !user.isBlocked,
          blocked: authenticated && Boolean(user.isBlocked),
          role: authenticated ? user.role : null,
        });
      } catch (err) {
        // Expired/invalid token: the session is gone, so this is a login
        // problem rather than a permissions problem.
        setAuthState({ loading: false, authenticated: false, isAdmin: false, blocked: false, role: null });
      }
    };

    verifyAdmin();
  }, []);

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm font-medium text-gray-500">
        Verifying administrator credentials...
      </div>
    );
  }

  // Not signed in at all -> send to login so they can authenticate first.
  // Showing 403 here would be wrong: they may well be a legitimate admin
  // whose session simply expired.
  if (!authState.authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Signed in, but suspended or lacking the admin role -> 403 Forbidden.
  if (!authState.isAdmin) {
    return (
      <Navigate
        to="/403"
        state={{
          allowedRoles: ['admin'],
          actualRole: authState.role,
          blocked: authState.blocked,
          from: location.pathname,
        }}
        replace
      />
    );
  }

  return <Outlet />;
}