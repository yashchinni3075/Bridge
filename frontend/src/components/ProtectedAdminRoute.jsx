import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../services/api';

export default function ProtectedAdminRoute() {
  const [authState, setAuthState] = useState({ loading: true, isAdmin: false });

  useEffect(() => {
    const verifyAdmin = async () => {
      const token = localStorage.getItem('bridge_token');
      if (!token) {
        setAuthState({ loading: false, isAdmin: false });
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data.success && res.data.user.role === 'admin' && !res.data.user.isBlocked) {
          setAuthState({ loading: false, isAdmin: true });
        } else {
          setAuthState({ loading: false, isAdmin: false });
        }
      } catch (err) {
        setAuthState({ loading: false, isAdmin: false });
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

  return authState.isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}