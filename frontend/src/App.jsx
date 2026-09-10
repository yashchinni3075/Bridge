import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/NavBar';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import StartupDashboard from './pages/startup/StartupDashboard';
import InvestorDashboard from './pages/investor/InvestorDashboard';
import FreelancerDashboard from './pages/freelancer/FreelancerDashBoard';
import ConnectionsPage from './pages/ConnectionsPage';

// Auth Protection
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminStartups from './pages/admin/AdminStartups';
import AdminInvestors from './pages/admin/AdminInvestors';
import AdminFreelancers from './pages/admin/AdminFreelancers';
import AdminVerification from './pages/admin/AdminVerification';
import VerifyOTP from './pages/VerifyOTP';  
import ForgotPassword from './pages/ForgotPasswordPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<><Navbar /><HomePage /></>} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Authenticated Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/connections" element={<><Navbar /><ConnectionsPage /></>} />
        </Route>

        {/* Protected Startup Dashboard & Portal */}
        <Route element={<ProtectedRoute allowedRoles={['startup', 'admin']} />}>
          <Route path="/startup-dashboard/*" element={<StartupDashboard />} />
          <Route path="/startup/profile" element={<Navigate to="/startup-dashboard/profile" replace />} />
        </Route>

        {/* Protected Investor Dashboard & Portal */}
        <Route element={<ProtectedRoute allowedRoles={['investor', 'admin']} />}>
          <Route path="/investor-dashboard/*" element={<InvestorDashboard />} />
          <Route path="/investor/profile" element={<Navigate to="/investor-dashboard/profile" replace />} />
        </Route>

        {/* Protected Freelancer Portal */}
        <Route element={<ProtectedRoute allowedRoles={['freelancer', 'admin']} />}>
          <Route path="/freelancer-dashboard/*" element={<FreelancerDashboard />} />
          <Route path="/freelancer/profile" element={<Navigate to="/freelancer-dashboard/profile" replace />} />
          <Route path="/freelancer/startups" element={<Navigate to="/freelancer-dashboard/startups" replace />} />
          <Route path="/freelancer/startups/:id" element={<Navigate to="/freelancer-dashboard/startups" replace />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<ProtectedAdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="startups" element={<AdminStartups />} />
            <Route path="investors" element={<AdminInvestors />} />
            <Route path="freelancers" element={<AdminFreelancers />} />
            <Route path="verification" element={<AdminVerification />} />
          </Route>
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}