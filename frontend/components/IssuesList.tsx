import { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, ExternalLink, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import axios from "axios";

interface Issue {
  _id: string;
  title: string;
  publicationDate: string;
  summary: string;
  introduction: string;
  status: "published" | "draft";
  newsletterId: string;
  newsletterTitle: string;
  paperCount: number;
}

interface Newsletter {
  _id: string;
  topic: string;
  description?: string;
  field?: string;
  createdDate: string;
  lastIssue: string;
  totalIssues: number;
}

interface IssuesListProps {
  onBack: () => void;
  onViewIssue: (issue: Issue) => void;
}

export function IssuesList({ onBack, onViewIssue }: IssuesListProps) {
  const location = useLocation();
  const { newsletter } = location.state as { newsletter: Newsletter };
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_MONGO_API_URL}/api/newsletters/${newsletter._id}/issues`);
        setIssues(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch issues.");
        console.error("Error fetching issues:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssues();
  }, [newsletter._id]);

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
        
        <div className="mb-4">
          <h1 className="mb-2">{newsletter.topic}</h1>
          {newsletter.description && (
            <p className="text-muted-foreground mb-4">
              {newsletter.description}
            </p>
          )}
          
          {newsletter.field && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{newsletter.field}</Badge>
            </div>
          )}
        </div>
      </div>

      {/* Issues Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-lg p-4 border">
          <h3>Total Issues</h3>
          <p className="text-muted-foreground mt-1">{issues.length}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <h3>Latest Issue</h3>
          <p className="text-muted-foreground mt-1">{issues.length > 0 ? new Date(issues[0].publicationDate).toLocaleDateString() : 'N/A'}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <h3>Total Papers</h3>
          <p className="text-muted-foreground mt-1">{issues.reduce((sum, issue) => sum + issue.paperCount, 0)}</p>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        <h2>All Issues</h2>
        
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading issues...</div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">Error: {error}</div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No issues found for this newsletter.</div>
        ) : (
          <div className="space-y-4">
              {issues.map((issue) => (
                <Card 
                  key={issue._id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onViewIssue(issue, newsletter)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {issue.title}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(issue.publicationDate).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {issue.paperCount} Papers
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-muted-foreground">
                      {issue.introduction}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
        )}
      </div>
    </div>
  );
}