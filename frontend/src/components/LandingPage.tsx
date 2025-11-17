import { HeroSection } from "./HeroSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { BenefitsSection } from "./BenefitsSection";
import { FeaturesDeepDiveSection } from "./FeaturesDeepDiveSection";
import { CtaSection } from "./CtaSection";



interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  isAuthenticated: boolean;
}

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/40">
      {/* Navigation */}
      <HeroSection onGetStarted={onGetStarted} onSignIn={onSignIn} />
      <HowItWorksSection />
      <BenefitsSection />
      <FeaturesDeepDiveSection />
      <CtaSection onGetStarted={onGetStarted} onSignIn={onSignIn} />
    </div>
  );
}