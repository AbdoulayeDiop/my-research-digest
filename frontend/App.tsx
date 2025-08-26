import { useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Dashboard } from "./components/Dashboard";
import { IssuesList } from "./components/IssuesList";
import { IssueDetail } from "./components/IssueDetail";
import { AdminDashboard } from "./components/AdminDashboard";
import { LandingPage } from "./components/LandingPage";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { AuthenticatedLayout } from "./components/AuthenticatedLayout";
import { TermsOfService } from "./components/TermsOfService";
import { LegalLayout } from "./components/LegalLayout";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

interface User {
  sub?: string; // Auth0 user ID
  name?: string;
  email?: string;
}

function AppContent() {
  const { isLoading, isAuthenticated, user, loginWithRedirect, logout } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    const syncUser = async () => {
      if (isAuthenticated && user) {
        try {
          await axios.post("http://localhost:5000/api/users/sync", {
            auth0Id: user.sub,
            email: user.email,
            name: user.name,
          });
        } catch (error) {
          console.error("Error syncing user:", error);
        }
      }
    };
    syncUser();
  }, [isAuthenticated, user]);

  const handleViewNewsletter = (newsletter: any) => {
    navigate(`/newsletters/${newsletter._id}`, { state: { newsletter } });
  };

  const handleViewIssue = (issue: any, newsletter: any) => {
    navigate(`/issues/${issue._id}`, { state: { issue, newsletter } });
  };

  const handleBackToNewsletters = () => {
    navigate('/');
  };

  const handleBackToIssues = (newsletter: any) => {
    navigate(`/newsletters/${newsletter._id}`, { state: { newsletter } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading My Research Digest...</p>
        </div>
      </div>
    );
  }

  return (
      <Routes>
        <Route path="/" element={isAuthenticated ? <AuthenticatedLayout user={user as User} onSignOut={() => logout({ logoutParams: { returnTo: window.location.origin } })} onNavigateToAdmin={() => {}}><Dashboard user={user as User} onViewNewsletter={handleViewNewsletter} isAuthenticated={isAuthenticated} /></AuthenticatedLayout> : <LandingPage onGetStarted={loginWithRedirect} onSignIn={loginWithRedirect} isAuthenticated={isAuthenticated} />} />
        <Route path="/newsletters/:newsletterId" element={<AuthenticatedLayout user={user as User} onSignOut={() => logout({ logoutParams: { returnTo: window.location.origin } })} onNavigateToAdmin={() => {}}><IssuesList onBack={handleBackToNewsletters} onViewIssue={handleViewIssue} /></AuthenticatedLayout>} />
        <Route path="/issues/:issueId" element={<AuthenticatedLayout user={user as User} onSignOut={() => logout({ logoutParams: { returnTo: window.location.origin } })} onNavigateToAdmin={() => {}}><IssueDetail onBack={handleBackToIssues} /></AuthenticatedLayout>} />
        <Route path="/privacy" element={<LegalLayout isAuthenticated={isAuthenticated} user={user as User}><PrivacyPolicy /></LegalLayout>} />
        <Route path="/terms" element={<LegalLayout isAuthenticated={isAuthenticated} user={user as User}><TermsOfService /></LegalLayout>} />
        <Route path="/admin" element={<AuthenticatedLayout user={user as User} onSignOut={() => logout({ logoutParams: { returnTo: window.location.origin } })} onNavigateToAdmin={() => {}}><AdminDashboard onBack={() => navigate('/')} /></AuthenticatedLayout>} />
      </Routes>
  );
}

export default function App() {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URI
      }}
    >
      <Router>
        <AppContent />
      </Router>
    </Auth0Provider>
  );
}