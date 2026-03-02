import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, FileText, Settings, CheckCircle2, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
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
  const [activeTab, setActiveTab] = useState(location.pathname.endsWith('/settings') ? 'settings' : 'issues');

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

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{newsletter.topic}</h1>
              <Badge 
                variant={newsletter.status === 'active' ? "default" : "secondary"}
                className={newsletter.status === 'active' ? "bg-green-600 hover:bg-green-700" : ""}
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
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1.5 h-12 w-full md:w-auto grid grid-cols-2 md:inline-flex gap-2">
          <TabsTrigger 
            value="issues" 
            className="gap-2 px-6 transition-all hover:bg-background/40 hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:border-primary/20"
          >
            <FileText className="w-4 h-4" />
            Weekly issues
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="gap-2 px-6 transition-all hover:bg-background/40 hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:border-primary/20"
          >
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="mt-0">
          <IssuesList 
            onViewIssue={(issue) => navigate(`/issues/${issue._id}`)}
            showHeader={false}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          <NewsletterSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
