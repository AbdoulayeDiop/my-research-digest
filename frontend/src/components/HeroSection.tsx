import { ArrowRight, BookOpen, Github, Brain, Database } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface HeroSectionProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function HeroSection({ onGetStarted, onSignIn }: HeroSectionProps) {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 ">
      <div className="mx-auto text-center">
        <Badge variant="secondary" className="mb-6">
          <BookOpen className="w-4 h-4 mr-2" />
          Free & Open Source • By Researchers, For Researchers
        </Badge>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Effortless Literature Tracking for Researchers
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-8 leading-relaxed">
          My Research Digest is a free, open-source tool designed to help you keep up with the ever-growing body of scientific literature. 
          Get weekly, AI-assisted digests of the most relevant papers in your field.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button size="lg" onClick={onGetStarted} className="text-lg px-8 py-6 h-auto">
            Create Your First Digest
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button variant="outline" size="lg" onClick={onSignIn} className="text-lg px-8 py-6 h-auto">
            Sign In
          </Button>
        </div>

        {/* Key Features Preview */}
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center bg-card/50 rounded-lg p-4 border">
            <Database className="w-5 h-5 text-primary mr-2" />
            <p className="text-sm font-medium">Automated Paper Sourcing</p>
          </div>
          <div className="flex items-center justify-center bg-card/50 rounded-lg p-4 border">
            <Brain className="w-5 h-5 text-primary mr-2" />
            <p className="text-sm font-medium">AI-Assisted Synthesis</p>
          </div>
          <div className="bg-card/50 rounded-lg p-4 border">
            <a href="https://github.com/AbdoulayeDiop/my-research-digest" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
              <Github className="w-5 h-5 text-primary mr-2" />
              <p className="text-sm font-medium">Open Source</p>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}