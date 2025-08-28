import { ArrowRight, Sparkles, Database, Star, Brain } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface HeroSectionProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function HeroSection({ onGetStarted, onSignIn }: HeroSectionProps) {
  return (
    <section className="container mx-auto px-6 py-20">
      <div className="max-w-4xl mx-auto text-center">
        <Badge variant="secondary" className="mb-6">
          <Sparkles className="w-4 h-4 mr-2" />
          100% Free • AI-Powered • No Credit Card Required
        </Badge>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Stay Ahead of Scientific Research
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
          Create personalized AI-powered newsletters that automatically discover, analyze, and synthesize 
          the top 5 research papers from your field of interest every week. Completely free, forever.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button size="lg" onClick={onGetStarted} className="text-lg px-8 py-6 h-auto">
            Start Your First Newsletter
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button variant="outline" size="lg" onClick={onSignIn} className="text-lg px-8 py-6 h-auto">
            Sign In
          </Button>
        </div>

        {/* Key Features Preview */}
        <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="bg-card/50 rounded-lg p-4 border">
            <Database className="w-6 h-6 text-primary mb-2 mx-auto" />
            <p className="text-sm font-medium">arXiv, Semantic Scholar & More</p>
          </div>
          <div className="bg-card/50 rounded-lg p-4 border">
            <Star className="w-6 h-6 text-primary mb-2 mx-auto" />
            <p className="text-sm font-medium">Top 5 Papers Weekly</p>
          </div>
          <div className="bg-card/50 rounded-lg p-4 border">
            <Brain className="w-6 h-6 text-primary mb-2 mx-auto" />
            <p className="text-sm font-medium">AI Analysis & Synthesis</p>
          </div>
        </div>
      </div>
    </section>
  );
}
