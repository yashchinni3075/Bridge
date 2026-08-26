import { useState } from "react";
import Header from "../../components/freelancer/Header";
import Sidebar from "../../components/freelancer/Sidebar";
import Dashboard from "./Dashboard";
import MatchEngine from "./MatchEngine";
import Pipeline from "./Pipeline";
import Verification from "./Verification";
import Profile from "./Profile";

export default function FreelancerLayout() {
  const [page, setPage] = useState("dashboard");

  const renderPage = () => {
    switch (page) {
      case "match":
        return <MatchEngine setPage={setPage} />;
      case "pipeline":
        return <Pipeline />;
      case "verification":
        return <Verification />;
      case "profile":
        return <Profile />;
      default:
        return <Dashboard setPage={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-gray-100">
      <Header />
      <div className="flex min-h-[calc(100vh-68px)] flex-col md:flex-row">
        <Sidebar page={page} setPage={setPage} />
        <main className="min-w-0 flex-1 p-4 md:p-7">
          <div className="mx-auto max-w-[1450px]">{renderPage()}</div>
        </main>
      </div>
    </div>
  );
}
