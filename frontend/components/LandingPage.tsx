import { HeroSection } from "./HeroSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { BenefitsSection } from "./BenefitsSection";
import { FeaturesDeepDiveSection } from "./FeaturesDeepDiveSection";
import { CtaSection } from "./CtaSection";
import { Footer } from "./Footer";
import { BookOpen } from "lucide-react";
import { Link } from 'react-router-dom';
import { Button } from "./ui/button";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  isAuthenticated: boolean;
}

export function LandingPage({ onGetStarted, onSignIn, isAuthenticated }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-xl">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">My Research Digest</h3>
                <p className="text-xs text-muted-foreground">AI-Powered Research</p>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center gap-4">
              <a href="#how-it-works" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">How it Works</a>
              <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Features</a>
              <Button variant="ghost" onClick={onSignIn}>
                Sign In
              </Button>
              <Button onClick={onGetStarted}>
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <HeroSection onGetStarted={onGetStarted} onSignIn={onSignIn} />
      <HowItWorksSection />
      <BenefitsSection />
      <FeaturesDeepDiveSection />
      <CtaSection onGetStarted={onGetStarted} onSignIn={onSignIn} />
      <Footer isAuthenticated={isAuthenticated} />
    </div>
  );
}