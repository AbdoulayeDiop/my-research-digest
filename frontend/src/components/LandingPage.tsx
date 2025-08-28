import { HeroSection } from "./HeroSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { BenefitsSection } from "./BenefitsSection";
import { FeaturesDeepDiveSection } from "./FeaturesDeepDiveSection";
import { CtaSection } from "./CtaSection";
import { Footer } from "./Footer";
import { BookOpen } from "lucide-react";
import { Link } from 'react-router-dom';
import { Button } from "./ui/button";
import { Navbar } from "./Navbar";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  isAuthenticated: boolean;
}

export function LandingPage({ onGetStarted, onSignIn, isAuthenticated }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Navigation */}
      <HeroSection onGetStarted={onGetStarted} onSignIn={onSignIn} />
      <HowItWorksSection />
      <BenefitsSection />
      <FeaturesDeepDiveSection />
      <CtaSection onGetStarted={onGetStarted} onSignIn={onSignIn} />
    </div>
  );
}