import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Calendar, ExternalLink, ThumbsUp, ThumbsDown, Heart, Bookmark, BookmarkCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import ReactMarkdown from 'react-markdown';

import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAxios } from "../lib/axios";
import { toast } from "sonner";

interface Issue {
  _id: string;
  title: string;
  publicationDate: string;
  introduction: string;
  conclusion: string;
  contentMarkdown?: string;
  papers: string[];
  status: "published" | "draft";
  newsletterId: string;
  issueFormat?: 'classic' | 'state_of_the_art';
  read: boolean;
}

interface Paper {
  _id: string;
  paperId?: string;
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
    issueFormat?: 'classic' | 'state_of_the_art';
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
  const [savedPaperIds, setSavedPaperIds] = useState<Set<string>>(new Set());
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

          // Fetch saved papers to show saved state
          try {
            const savedResponse = await axios.get('/users/saved-papers');
            setSavedPaperIds(new Set(savedResponse.data.map((p: any) => p.paperId)));
          } catch (err) {
            console.error("Error fetching saved papers:", err);
          }
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

  const handleToggleSavePaper = async (paper: Paper) => {
    const paperIdToUse = paper.paperId || paper._id;
    const isSaved = savedPaperIds.has(paperIdToUse);
    
    try {
      if (isSaved) {
        await axios.delete(`/users/saved-papers/${paperIdToUse}`);
        const newSavedIds = new Set(savedPaperIds);
        newSavedIds.delete(paperIdToUse);
        setSavedPaperIds(newSavedIds);
        toast.success("Paper removed from saved papers");
      } else {
        await axios.post('/users/save-paper', {
          paperId: paperIdToUse,
          title: paper.title,
          authors: paper.authors,
          publicationDate: paper.publicationDate,
          abstract: paper.abstract,
          url: paper.url,
          venueName: paper.venueName,
          synthesis: paper.synthesis,
          usefulness: paper.usefulness
        });
        const newSavedIds = new Set(savedPaperIds);
        newSavedIds.add(paperIdToUse);
        setSavedPaperIds(newSavedIds);
        toast.success("Paper saved to your library");
      }
    } catch (error) {
      console.error("Error toggling saved paper:", error);
      toast.error("Failed to save paper");
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
    <div className="max-w-6xl mx-auto p-6">
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

          {issue.issueFormat !== 'state_of_the_art' && issue.introduction && (
            <div className="bg-muted/30 rounded-lg p-4 mt-8 shadow-sm">
              <h3 className="mb-2">Introduction</h3>
              <p className="text-muted-foreground leading-relaxed">
                {issue.introduction}
              </p>
            </div>
          )}
        </div>
      </div>

      {issue.issueFormat === 'state_of_the_art' ? (
        <>
          <div className="mb-8 leading-relaxed">
            <ReactMarkdown
              components={{
                h2: ({ children }) => <h2 className="text-xl font-bold mt-8 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-semibold mt-5 mb-1">{children}</h3>,
                p:  ({ children }) => <p className="mb-4 text-base">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                a:  ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:opacity-75">{children}</a>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
                li: ({ children }) => <li className="ml-2">{children}</li>,
              }}
            >
              {issue.contentMarkdown ?? ''}
            </ReactMarkdown>
          </div>

          <div>
            <h2 className="mb-4">Papers in this issue</h2>
            {papers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No papers found for this issue.</div>
            ) : (
              <div className="space-y-3">
                {papers.map((paper, index) => (
                  <Card key={paper._id} className="shadow-sm">
                    <CardHeader withSeparator={false}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-base leading-snug font-semibold">
                            {`${index + 1}. ${paper.title}`}
                          </CardTitle>
                          <div className="text-sm text-muted-foreground mt-1">
                            <span>{paper.authors.join(", ")}</span>
                            {paper.venueName && (
                              <span className="ml-2 text-xs text-gray-500">({paper.venueName})</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 justify-end sm:justify-start">
                          <Button
                            variant="ghost"
                            size="sm"
                            title={savedPaperIds.has(paper.paperId || paper._id) ? "Unsave paper" : "Save paper"}
                            onClick={() => handleToggleSavePaper(paper)}
                          >
                            {savedPaperIds.has(paper.paperId || paper._id) ? (
                              <BookmarkCheck className="w-4 h-4 text-primary" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </Button>
                          <a href={paper.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm" title="Rate this paper">
                                {paper.feedback === 'like' && <ThumbsUp className="w-4 h-4 text-blue-500" fill="currentColor" />}
                                {paper.feedback === 'dislike' && <ThumbsDown className="w-4 h-4 text-red-500" fill="currentColor" />}
                                {paper.feedback === 'heart' && <Heart className="w-4 h-4 text-pink-500" fill="currentColor" />}
                                {!paper.feedback && <ThumbsUp className="w-4 h-4 text-muted-foreground" />}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-1" align="end">
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleFeedback(paper._id, paper.feedback === 'like' ? null : 'like')}>
                                  <ThumbsUp className={`w-4 h-4 ${paper.feedback === 'like' ? 'text-blue-500' : 'text-muted-foreground'}`} fill={paper.feedback === 'like' ? 'currentColor' : 'none'} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleFeedback(paper._id, paper.feedback === 'dislike' ? null : 'dislike')}>
                                  <ThumbsDown className={`w-4 h-4 ${paper.feedback === 'dislike' ? 'text-red-500' : 'text-muted-foreground'}`} fill={paper.feedback === 'dislike' ? 'currentColor' : 'none'} />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleFeedback(paper._id, paper.feedback === 'heart' ? null : 'heart')}>
                                  <Heart className={`w-4 h-4 ${paper.feedback === 'heart' ? 'text-pink-500' : 'text-muted-foreground'}`} fill={paper.feedback === 'heart' ? 'currentColor' : 'none'} />
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div>
            <h2 className="mb-4">Featured Research Papers</h2>
            {papers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No papers found for this issue.</div>
            ) : (
              <div className="space-y-6">
                {papers.map((paper, index) => (
                  <Card key={paper._id} className="shadow-sm hover:shadow-md transition-shadow">
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
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            title={savedPaperIds.has(paper.paperId || paper._id) ? "Unsave paper" : "Save paper"}
                            onClick={() => handleToggleSavePaper(paper)}
                          >
                            {savedPaperIds.has(paper.paperId || paper._id) ? (
                              <BookmarkCheck className="w-4 h-4 text-primary" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </Button>
                          <a href={paper.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        </div>
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

          <div className="mt-8 bg-muted/30 rounded-lg p-4 shadow-sm">
            <h3 className="mb-2">Conclusion</h3>
            <p className="text-muted-foreground leading-relaxed">
              {issue.conclusion}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
