import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { AppStateProvider } from "./context/AppStateContext";
import { FreelancerProvider } from "./context/FreelancerContext";
import Layout from "./components/Layout.jsx";
import LandingPage from "./pages/LandingPage/LandingPage.jsx";
import LoginPage from "./pages/LoginPage/LoginPage.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Investors from "./pages/Investors.jsx";
import InvestorProfile from "./pages/InvestorProfile.jsx";
import Teammates from "./pages/Teammates.jsx";
import TeammateProfile from "./pages/TeammateProfile.jsx";
import Calendar from "./pages/Calendar.jsx";
import Milestones from "./pages/Milestones.jsx";
import PitchScorePage from "./pages/PitchScorePage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import InvestorDashboard from "./pages/investor/InvestorDashboard.jsx";
import FreelancerLayout from "./pages/freelancer/FreelancerLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppStateProvider>
      <FreelancerProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/investor-dashboard" element={<InvestorDashboard />} />
            <Route path="/freelancer-dashboard" element={<FreelancerLayout />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />

            <Route element={<Layout />}>
              <Route path="/startup-dashboard" element={<Dashboard />} />
              <Route path="/investors" element={<Investors />} />
              <Route path="/investors/:id" element={<InvestorProfile />} />
              <Route path="/teammates" element={<Teammates />} />
              <Route path="/teammates/:id" element={<TeammateProfile />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/milestones" element={<Milestones />} />
              <Route path="/pitch" element={<PitchScorePage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </FreelancerProvider>
    </AppStateProvider>
  </StrictMode>,
);
