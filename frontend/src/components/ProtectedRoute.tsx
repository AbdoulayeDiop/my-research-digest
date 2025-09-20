import { useAuth0 } from '@auth0/auth0-react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  [key: string]: any;
}

export function ProtectedRoute({ component: Component, ...props }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Component {...props} />;
}