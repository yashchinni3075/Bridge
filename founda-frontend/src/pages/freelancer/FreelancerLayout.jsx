import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/freelancer/Header";
import Sidebar from "../../components/freelancer/Sidebar";
import Dashboard from "./Dashboard";
import MatchEngine from "./MatchEngine";
import Pipeline from "./Pipeline";
import Verification from "./Verification";
import Profile from "./Profile";

export default function FreelancerLayout() {
  const [page, setPage] = useState("dashboard");
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderPage = () => {
    switch (page) {
      case "match":
        return <MatchEngine setPage={setPage} />;
      case "pipeline":
        return <Pipeline setPage={setPage} />;
      case "verification":
        return <Verification setPage={setPage} />;
      case "profile":
        return <Profile setPage={setPage} />;
      default:
        return <Dashboard setPage={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-founda-surface">
      <Header />
      <div className="flex min-h-[calc(100vh-64px)] flex-col md:flex-row">
        <Sidebar page={page} setPage={setPage} />
        <main className="min-w-0 flex-1 p-4 md:p-7">
          <div className="mx-auto max-w-[1400px] animate-fade-in">
            <div className="mb-4 flex justify-end">
              <button onClick={handleLogout} className="btn-danger">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}
