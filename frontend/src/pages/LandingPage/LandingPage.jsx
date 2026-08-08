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

export default function LandingPage({ onLogin }) {
  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-white text-[#07142f]">
      <Navbar onLogin={onLogin} />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <CommunityStats />
        <Challenge />
        <ProcessSteps />
        <Features />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
