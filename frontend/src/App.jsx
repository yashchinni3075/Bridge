import { useState } from "react";
import LandingPage from "./pages/LandingPage/LandingPage";
import LoginPage from "./pages/LoginPage/LoginPage";

function App() {
  const [page, setPage] = useState("home");

  if (page === "login") {
    return <LoginPage onBackHome={() => setPage("home")} />;
  }

  return <LandingPage onLogin={() => setPage("login")} />;
}

export default App;
