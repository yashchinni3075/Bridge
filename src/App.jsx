import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppStateProvider } from "./context/AppStateContext";
import { ToastStack } from "./components/NotificationCenter";
import Layout from "./components/Layout";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Investors from "./pages/Investors";
import InvestorProfile from "./pages/InvestorProfile";
import Teammates from "./pages/Teammates";
import TeammateProfile from "./pages/TeammateProfile";
import Calendar from "./pages/Calendar";
import Milestones from "./pages/Milestones";
import PitchScorePage from "./pages/PitchScorePage";
import MyProfile from "./pages/MyProfile";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/investors/:id" element={<InvestorProfile />} />
            <Route path="/teammates" element={<Teammates />} />
            <Route path="/teammates/:id" element={<TeammateProfile />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/milestones" element={<Milestones />} />
            <Route path="/pitch" element={<PitchScorePage />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/profile/edit" element={<ProfilePage />} />
          </Route>
        </Routes>
        <ToastStack />
      </BrowserRouter>
    </AppStateProvider>
  );
}
