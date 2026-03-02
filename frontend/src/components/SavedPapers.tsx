import { useState, useEffect } from "react";
import { useAxios } from "../lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { BookmarkCheck, ExternalLink, ArrowLeft, BookOpen, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface SavedPaper {
  _id: string;
  paperId: string;
  title: string;
  authors: string[];
  publicationDate: string;
  url: string;
  venueName?: string;
  synthesis: string;
  usefulness: string;
  savedAt: string;
}

export function SavedPapers() {
  const [savedPapers, setSavedPapers] = useState<SavedPaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const axios = useAxios();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSavedPapers();
  }, []);

  const fetchSavedPapers = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/users/saved-papers');
      setSavedPapers(response.data);
    } catch (err) {
      setError("Failed to fetch saved papers.");
      console.error("Error fetching saved papers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsavePaper = async (paperId: string) => {
    try {
      await axios.delete(`/users/saved-papers/${paperId}`);
      setSavedPapers(savedPapers.filter(p => p.paperId !== paperId));
      toast.success("Paper removed from library");
    } catch (error) {
      console.error("Error unsaving paper:", error);
      toast.error("Failed to remove paper");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-10 text-center">
        <p className="text-muted-foreground">Loading your library...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <BookmarkCheck className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold">Your Saved Research</h1>
        </div>
        <p className="text-muted-foreground">
          A collection of research papers you've bookmarked for later.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {savedPapers.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">Your library is empty</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Save interesting papers from your newsletter issues to build your personal research collection.
          </p>
          <Button onClick={() => navigate('/')}>Explore Newsletters</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {savedPapers.map((paper) => (
            <Card key={paper._id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader withSeparator={false}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 mr-4">
                    <CardTitle className="text-lg leading-snug mb-2 font-bold">
                      {paper.title}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground mb-2">
                      <span>{paper.authors.join(", ")}</span>
                      {paper.venueName && (
                        <span className="ml-2 text-xs text-gray-500">({paper.venueName})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Published: {new Date(paper.publicationDate).toLocaleDateString()}</span>
                      <span>Saved: {new Date(paper.savedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      title="Remove from library"
                      onClick={() => handleUnsavePaper(paper.paperId)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
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
                <div className="grid md:grid-cols-2 gap-6 pt-2">
                  <div>
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-primary mb-2">Synthesis</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {paper.synthesis}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-primary mb-2">Why it matters?</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {paper.usefulness}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
