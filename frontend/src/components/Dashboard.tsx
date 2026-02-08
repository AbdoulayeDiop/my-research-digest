import { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { NewsletterCard } from "./NewsletterCard";
import { AddNewsletterDialog } from "./AddNewsletterDialog";
import { useAxios } from "../lib/axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface Newsletter {
  _id: string; // MongoDB uses _id
  topic: string;
  description?: string;
  field?: string;
  createdAt: string; // Changed from createdDate
  totalIssues: number;
  lastIssueDate?: string; // New field from aggregation
}

interface User {
  _id: string; // MongoDB user ID
  sub?: string;
  name?: string;
  email?: string;
}

interface DashboardProps {
  user: User;
  onViewNewsletter: (newsletter: Newsletter) => void;
}

export function Dashboard({ user, onViewNewsletter }: DashboardProps) {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newsletterToDelete, setNewsletterToDelete] = useState<string | null>(null);
  const axios = useAxios();

  const fetchNewsletters = async () => {
    if (!user?.sub) return;
    try {
      setIsLoading(true);
      // Change from POST to GET and remove userId from body
      const response = await axios.get('/newsletters');
      setNewsletters(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch newsletters.");
      console.error("Error fetching newsletters:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.sub) {
      // console.log("User", user);
      // console.log("Fetching newsletters for user:", user.name);
      fetchNewsletters();
    }
  }, [user?.sub]);

  // Filter and sort newsletters based on search query
  const filteredNewsletters = useMemo(() => {
    const sortedNewsletters = [...newsletters].sort((a, b) => {
      const aDate = a.lastIssueDate ? new Date(a.lastIssueDate) : new Date(a.createdAt);
      const bDate = b.lastIssueDate ? new Date(b.lastIssueDate) : new Date(b.createdAt);
      return bDate.getTime() - aDate.getTime();
    });

    if (!searchQuery.trim()) {
      return sortedNewsletters;
    }

    const query = searchQuery.toLowerCase();
    return sortedNewsletters.filter(newsletter =>
      newsletter.topic.toLowerCase().includes(query) ||
      (newsletter.description && newsletter.description.toLowerCase().includes(query)) ||
      (newsletter.field && newsletter.field.toLowerCase().includes(query))
    );
  }, [newsletters, searchQuery]);

  const handleCreateNewsletter = async (newNewsletter: Newsletter) => {
    setNewsletters(prev => [newNewsletter, ...prev]);
  };

  const handleDeleteClick = (id: string) => {
    setNewsletterToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!newsletterToDelete) return;
    try {
      await axios.delete(`/newsletters/${newsletterToDelete}`);
      setNewsletters(prev => prev.filter(newsletter => newsletter._id !== newsletterToDelete));
      setNewsletterToDelete(null);
    } catch (err) {
      setError("Failed to delete newsletter.");
      console.error("Error deleting newsletter:", err);
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        {user?.name? <h1 className="mb-2">Welcome back, {user.name.split(' ')[0]}!</h1>: <h1 className="mb-2">Welcome to My Research Digest</h1>}
        <p className="text-muted-foreground">
          Manage your AI-powered scientific newsletters
        </p>
      </div>

      {/* Actions Bar */}
      {newsletters.length > 0 && (<div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by newsletter topic, description, or research field..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Create Newsletter Button */}
        <AddNewsletterDialog onCreate={handleCreateNewsletter} user={user} />
      </div>)}

      {/* Newsletter Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-lg p-4 border">
          <h3>Active Newsletters</h3>
          <p className="text-muted-foreground mt-1">{newsletters.length}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <h3>Total Issues</h3>
          <p className="text-muted-foreground mt-1">
            {newsletters.reduce((sum, n) => sum + (n.totalIssues || 0), 0)}
          </p>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <h3>Research Fields</h3>
          <p className="text-muted-foreground mt-1">
            {new Set(newsletters.map(n => n.field || n.topic)).size}
          </p>
        </div>
      </div>

      {/* Newsletter Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading newsletters...</div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">Error: {error}</div>
      ) : filteredNewsletters.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'No newsletters match your search.' : 'No scientific newsletters created yet.'}
          </p>
          {!searchQuery && (
            <AddNewsletterDialog onCreate={handleCreateNewsletter} user={user} />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNewsletters.map((newsletter) => (
            <NewsletterCard
              key={newsletter._id}
              newsletter={newsletter}
              onDelete={handleDeleteClick}
              onView={(newsletter) => onViewNewsletter(newsletter)}
            />
          ))}
        </div>
      )}

      {/* Search Results Count */}
      {searchQuery && (
        <div className="mt-6 text-center text-muted-foreground">
          Found {filteredNewsletters.length} newsletter{filteredNewsletters.length !== 1 ? 's' : ''} 
          matching "{searchQuery}"
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this newsletter and all its issues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}