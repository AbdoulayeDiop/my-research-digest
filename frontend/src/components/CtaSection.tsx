import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

interface CtaSectionProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function CtaSection({ onGetStarted, onSignIn }: CtaSectionProps) {
  return (
    <section className="container mx-auto px-6 py-20 bg-muted/30">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Transform Your Research Workflow?
        </h2>
        <p className="text-xl text-muted-foreground mb-8">
          Join thousands of researchers who stay ahead of the curve with AI-powered research digests. 
          Start your first newsletter in under 2 minutes.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={onGetStarted} className="text-lg px-8 py-6 h-auto">
            Create Your First Newsletter
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button variant="outline" size="lg" onClick={onSignIn} className="text-lg px-8 py-6 h-auto">
            I Already Have an Account
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-6">
          No signup required to browse • Always free • No spam, ever
        </p>
      </div>
    </section>
  );
}
