import { BookOpen, Shield } from "lucide-react";
import { Link } from 'react-router-dom';

export function Footer({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <footer className="border-t bg-muted/30 mt-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold">My Research Digest</span>
            </Link>
            <p className="text-muted-foreground mb-4">
              The free AI-powered platform for staying current with scientific research. 
              Automatically curated, intelligently analyzed, delivered weekly.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>AI-powered research platform</span>
            </div>
          </div>
          
          {!isAuthenticated && (
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/#how-it-works" className="hover:text-primary">How it Works</Link></li>
                <li><Link to="/#features" className="hover:text-primary">Features</Link></li>
              </ul>
            </div>
          )}
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>Contact us at <a href="mailto:contact@my-research-digest.com" className="hover:text-primary">contact@my-research-digest.com</a></li>
              <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t pt-8 mt-8 text-center text-muted-foreground">
          <p>&copy; 2025 My Research Digest. All rights reserved. • Free AI-Powered Research Platform</p>
        </div>
      </div>
    </footer>
  );
}
