import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";

interface CtaSectionProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function CtaSection({ onGetStarted, onSignIn }: CtaSectionProps) {
  return (
    <section className="mx-auto px-6 py-20">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Start Curating Your Field's Literature
        </h2>
        <p className="text-xl text-muted-foreground mb-8">
          Begin organizing your research digests today. This project is open-source, and contributions are welcome.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={onGetStarted} className="text-lg px-8 py-6 h-auto">
            Create Your First Digest
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button variant="outline" size="lg" onClick={onSignIn} className="text-lg px-8 py-6 h-auto">
            Sign In
          </Button>
        </div>
      </div>
    </section>
  );
}