import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface User {
  sub?: string; // Auth0 user ID
  name?: string;
  email?: string;
  // Add other Auth0 user properties as needed
}

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  user: User | null;
  onSignOut: () => void;
  onNavigateToAdmin: () => void;
}

export function AuthenticatedLayout({ children, user, onSignOut, onNavigateToAdmin }: AuthenticatedLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onSignOut={onSignOut} onNavigateToAdmin={onNavigateToAdmin} />
      {children}
      <Footer isAuthenticated={true} />
    </div>
  );
}
