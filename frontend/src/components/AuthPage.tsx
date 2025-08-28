import { BookOpen } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface AuthPageProps {
  onSignIn: () => void;
}

export function AuthPage({ onSignIn }: AuthPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-xl">
              <BookOpen className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold">My Research Digest</h1>
          <p className="text-muted-foreground">
            Create AI-powered newsletters from scientific research
          </p>
        </div>

        {/* Auth Forms */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in to access your research newsletters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onSignIn} className="w-full">
              Sign In with Auth0
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}