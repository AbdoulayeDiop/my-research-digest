import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { IssuesList } from "./IssuesList";
import { NewsletterSettings } from "./NewsletterSettings";
import { useAxios } from "../lib/axios";

interface Newsletter {
  _id: string;
  topic: string;
  description?: string;
  status: 'active' | 'inactive';
  field?: string;
}

export function NewsletterPage() {
  const { newsletterId } = useParams<{ newsletterId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const axios = useAxios();

  const [newsletter, setNewsletter] = useState<Newsletter | null>(location.state?.newsletter);
  const [isLoading, setIsLoading] = useState(!location.state?.newsletter);
  const [showSettings, setShowSettings] = useState(location.pathname.endsWith('/settings'));

  useEffect(() => {
    if (!newsletter) {
      fetchNewsletter();
    }
  }, [newsletterId]);

  const fetchNewsletter = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/newsletters/${newsletterId}`);
      setNewsletter(response.data);
    } catch (error) {
      console.error("Error fetching newsletter:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-20 text-center">
        <p className="text-muted-foreground animate-pulse">Loading newsletter...</p>
      </div>
    );
  }

  if (!newsletter) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold">Newsletter not found</h2>
        <Button variant="link" onClick={() => navigate("/")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-6 max-w-6xl">
      {/* Unified Header */}
      <div className="mb-8 space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-2 gap-2 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{newsletter.topic}</h1>
              <Badge
                variant={newsletter.status === 'active' ? "success" : "secondary"}
              >
                {newsletter.status === 'active' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                {newsletter.status.toUpperCase()}
              </Badge>
            </div>
            {newsletter.description && (
              <p className="text-muted-foreground max-w-3xl leading-relaxed">
                {newsletter.description}
              </p>
            )}
          </div>
          <Button
            variant={showSettings ? "secondary" : "ghost"}
            size="icon"
            title={showSettings ? "Back to issues" : "Settings"}
            onClick={() => setShowSettings(v => !v)}
            className="shrink-0 mt-1"
          >
            {showSettings ? <ArrowLeft className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {showSettings ? (
        <NewsletterSettings />
      ) : (
        <IssuesList
          onViewIssue={(issue) => navigate(`/issues/${issue._id}`)}
          showHeader={false}
        />
      )}
    </div>
  );
}
