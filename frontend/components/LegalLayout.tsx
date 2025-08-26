import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function LegalLayout({ children, isAuthenticated, user }: { children: React.ReactNode, isAuthenticated: boolean, user: any }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onSignOut={() => {}} onNavigateToAdmin={() => {}} />
      {children}
      <Footer isAuthenticated={isAuthenticated} />
    </div>
  );
}
