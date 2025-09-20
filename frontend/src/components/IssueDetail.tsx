import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Calendar, ExternalLink, ThumbsUp, ThumbsDown, Heart } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAxios } from "../lib/axios";

interface Issue {
  _id: string;
  title: string;
  publicationDate: string;
  introduction: string;
  conclusion: string;
  papers: string[];
  status: "published" | "draft";
  newsletterId: string;
  read: boolean;
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
  venueName?: string;
  feedback: 'like' | 'dislike' | 'heart' | null;
}

interface Newsletter {
    _id: string;
    userId: string;
}

interface IssueDetailProps {
  onBack: (newsletter: any) => void;
}

export function IssueDetail({ onBack }: IssueDetailProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { issueId } = useParams<{ issueId: string }>();
  
  const [issue, setIssue] = useState<Issue | null>(location.state?.issue);
  const [newsletter, setNewsletter] = useState<Newsletter | null>(location.state?.newsletter);
  
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const axios = useAxios();

  useEffect(() => {
    const fetchIssueAndPapers = async () => {
      try {
        setIsLoading(true);
        let currentIssue = location.state?.issue;
        if (!currentIssue) {
          const issueResponse = await axios.get(`/issues/${issueId}`);
          currentIssue = issueResponse.data;
          setIssue(currentIssue);
        }

        if (currentIssue) {
          const papersResponse = await axios.get(`/papers/byIssue/${currentIssue._id}`);
          setPapers(papersResponse.data);
        }
        
        if (!location.state?.newsletter && currentIssue) {
            const newsletterResponse = await axios.get(`/newsletters/${currentIssue.newsletterId}`);
            setNewsletter(newsletterResponse.data);
        }

      } catch (err) {
        setError("Failed to fetch issue or papers.");
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssueAndPapers();
  }, [issueId, axios, location.state]);

  useEffect(() => {
    const markAsRead = async () => {
      if (issue && !issue.read) {
        try {
          await axios.put(`/issues/${issue._id}/read`, { read: true });
          setIssue({ ...issue, read: true });
        } catch (error) {
          console.error("Error marking issue as read:", error);
        }
      }
    };

    markAsRead();
  }, [issue, axios]);

  const handleBack = () => {
    if (newsletter) {
      onBack(newsletter);
    } else {
      navigate('/'); // Fallback if no newsletter context
    }
  };

  const handleFeedback = async (paperId: string, feedback: 'like' | 'dislike' | 'heart' | null) => {
    try {
      const response = await axios.put(`/papers/${paperId}/feedback`, { feedback });
      const updatedPaper = response.data;
      setPapers(papers.map(p => p._id === paperId ? updatedPaper : p));
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading issue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }
  
  if (!issue) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Issue not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Helmet>
        <title>{issue.title} - My Research Digest</title>
        <meta name="description" content={issue.introduction} />
        <meta property="og:title" content={`${issue.title} - My Research Digest`} />
        <meta property="og:description" content={issue.introduction} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://www.my-research-digest.com/issues/${issue._id}`} />
        <meta property="og:image" content="https://my-research-digest.com/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${issue.title} - My Research Digest`} />
        <meta name="twitter:description" content={issue.introduction} />
        <meta name="twitter:image" content="https://my-research-digest.com/logo.png" />
      </Helmet>
      
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
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

          <div className="bg-muted/30 rounded-lg p-4 mt-8">
            <h3 className="mb-2">Introduction</h3>
            <p className="text-muted-foreground leading-relaxed">
              {issue.introduction}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4">Featured Research Papers</h2>
        {papers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No papers found for this issue.</div>
        ) : (
          <div className="space-y-6">
            {papers.map((paper, index) => (
              <Card key={paper._id} className="hover:shadow-md transition-shadow">
                <CardHeader withSeparator={false}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-4">
                      <CardTitle className="text-lg leading-snug mb-2 font-bold">
                        {`${index + 1}. ${paper.title}`}
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
                  <h4 className="font-semibold">Synthesis</h4>
                  <p className="text-base text-muted-foreground mb-2">
                    {paper.synthesis}
                  </p>
                  <h4 className="font-semibold">Why it matters?</h4>
                  <p className="text-base text-muted-foreground">
                    {paper.usefulness}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end gap-4">
                  <Button variant="ghost" size="icon" onClick={() => handleFeedback(paper._id, paper.feedback === 'like' ? null : 'like')}>
                    <ThumbsUp className={`w-5 h-5 ${paper.feedback === 'like' ? 'text-blue-500' : 'text-muted-foreground'}`} fill={paper.feedback === 'like' ? 'currentColor' : 'none'} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleFeedback(paper._id, paper.feedback === 'dislike' ? null : 'dislike')}>
                    <ThumbsDown className={`w-5 h-5 ${paper.feedback === 'dislike' ? 'text-red-500' : 'text-muted-foreground'}`} fill={paper.feedback === 'dislike' ? 'currentColor' : 'none'} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleFeedback(paper._id, paper.feedback === 'heart' ? null : 'heart')}>
                    <Heart className={`w-5 h-5 ${paper.feedback === 'heart' ? 'text-pink-500' : 'text-muted-foreground'}`} fill={paper.feedback === 'heart' ? 'currentColor' : 'none'} />
                  </Button>
                </CardFooter>
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