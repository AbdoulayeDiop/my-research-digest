import { Navbar } from "./components/Navbar";
import { Dashboard } from "./components/Dashboard";
import { IssuesList } from "./components/IssuesList";
import { IssueDetail } from "./components/IssueDetail";
import { AdminDashboard } from "./components/AdminDashboard";
import { LandingPage } from "./components/LandingPage";
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { TermsOfService } from "./components/TermsOfService";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Footer } from "./components/Footer";
import { useUserSync } from "./hooks/useUserSync";
import { HelmetProvider } from 'react-helmet-async';

interface User {
  _id: string; // MongoDB user ID
  sub?: string; // Auth0 user ID
  name?: string;
  email?: string;
}

function AppContent() {
  const { isLoading, isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const syncedUser = useUserSync();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-background">
      <Navbar user={syncedUser as User} onSignOut={() => logout({ logoutParams: { returnTo: window.location.origin } })} onSignIn={loginWithRedirect} onGetStarted={loginWithRedirect} />
      <main className="max-w-6xl mx-auto min-h-[calc(100vh-15rem)]">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Dashboard user={syncedUser as User} onViewNewsletter={handleViewNewsletter} /> : <LandingPage onGetStarted={loginWithRedirect} onSignIn={loginWithRedirect} isAuthenticated={isAuthenticated} />} />
          <Route path="/newsletters/:newsletterId" element={<IssuesList onBack={handleBackToNewsletters} onViewIssue={handleViewIssue} />} />
          <Route path="/issues/:issueId" element={<IssueDetail onBack={handleBackToIssues} />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/admin" element={<AdminDashboard onBack={() => navigate('/')} />} />
        </Routes>
      </main>
      <Footer isAuthenticated={isAuthenticated} />
    </div>
  );
}

export default function App() {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URI,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: 'openid profile email'
      }}
    >
      <Router>
        <HelmetProvider>
          <AppContent />
        </HelmetProvider>
      </Router>
    </Auth0Provider>
  );
}
