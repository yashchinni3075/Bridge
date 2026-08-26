import { useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import HowItWorks from "./components/HowItWorks";
import CommunityStats from "./components/CommunityStats";
import Challenge from "./components/Challenge";
import ProcessSteps from "./components/ProcessSteps";
import Features from "./components/Features";
import Testimonials from "./components/Testimonials";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-[#0a0f1e] text-gray-100">
      <Navbar onLogin={() => navigate("/login")} onRegister={() => navigate("/register")} />
      <main className="flex-1">
        <Hero onRegister={() => navigate("/register")} />
        <HowItWorks />
        <CommunityStats />
        <Challenge />
        <ProcessSteps />
        <Features />
        <Testimonials />
        <CTASection onRegister={() => navigate("/register")} />
      </main>
      <Footer />
    </div>
  );
}
