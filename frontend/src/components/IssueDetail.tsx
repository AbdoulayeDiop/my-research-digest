import { ArrowLeft, Calendar, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

import { useState, useEffect } from "react";
import { useLocation } from 'react-router-dom';
import { useAxios } from "../lib/axios";

interface Issue {
  _id: string;
  title: string;
  publicationDate: string;
  introduction: string;
  conclusion: string;
  papers: string[];
  status: "published" | "draft";
}

interface Paper {
  _id: string;
  title: string;
  authors: string[];
  publicationDate: string;
  abstract: string;
  url: string;
  synthesis: string;
  usefulness: string;
  score: number;
  venueName?: string; // Add venueName
}

interface IssueDetailProps {
  onBack: (newsletter: any) => void;
}

export function IssueDetail({ onBack }: IssueDetailProps) {
  const location = useLocation();
  const { issue, newsletter } = location.state as { issue: Issue, newsletter: any };
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const axios = useAxios();

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`/papers/byIssue/${issue._id}`);
        setPapers(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch papers for this issue.");
        console.error("Error fetching papers:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (issue._id) { // Fetch papers if issue ID is available
      fetchPapers();
    } else {
      setIsLoading(false);
    }
  }, [issue._id, axios]);

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => onBack(newsletter)}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Issues
        </Button>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1>{issue.title}</h1>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Published {new Date(issue.publicationDate).toLocaleDateString()}
            </div>
            
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="mb-2">Introduction</h3>
            <p className="text-muted-foreground leading-relaxed">
              {issue.introduction}
            </p>
          </div>
        </div>
      </div>

      {/* Research Papers */}
      <div>
        <h2 className="mb-4">Featured Research Papers</h2>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading papers...</div>
        ) : error ? (
          <div className="text-center py-12 text-destructive">Error: {error}</div>
        ) : papers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No papers found for this issue.</div>
        ) : (
          <div className="space-y-6">
            {papers.map((paper) => (
              <Card key={paper._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-4">
                      <CardTitle className="text-lg leading-snug mb-2">
                        {paper.title}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground mb-2">
                        <span>{paper.authors.join(", ")}</span>
                        {paper.venueName && (
                          <span className="ml-2 text-xs text-gray-500">({paper.venueName})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{new Date(paper.publicationDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <a href={paper.url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                </CardHeader>

                <CardContent>
                  <h4 className="font-semibold">Synthesis:</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {paper.synthesis}
                  </p>
                  <h4 className="font-semibold">Usefulness:</h4>
                  <p className="text-sm text-muted-foreground">
                    {paper.usefulness}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 bg-muted/30 rounded-lg p-4">
        <h3 className="mb-2">Conclusion</h3>
        <p className="text-muted-foreground leading-relaxed">
          {issue.conclusion}
        </p>
      </div>
    </div>
  );
}