import { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { NewsletterCard } from "./NewsletterCard";
import { AddNewsletterDialog } from "./AddNewsletterDialog";
import axios from "axios";

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
  sub: string;
  name: string;
  email: string;
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

  const fetchNewsletters = async () => {
    if (!user?.sub) return;
    try {
      setIsLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_MONGO_API_URL}/api/newsletters/user`, { userId: user.sub });
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
      console.log("Fetching newsletters for user:", user.name);
      fetchNewsletters();
    }
  }, [user?.sub]);

  // Filter newsletters based on search query
  const filteredNewsletters = useMemo(() => {
    if (!searchQuery.trim()) {
      return newsletters;
    }

    const query = searchQuery.toLowerCase();
    return newsletters.filter(newsletter =>
      newsletter.topic.toLowerCase().includes(query) ||
      (newsletter.description && newsletter.description.toLowerCase().includes(query)) ||
      (newsletter.field && newsletter.field.toLowerCase().includes(query))
    );
  }, [newsletters, searchQuery]);

  const handleCreateNewsletter = async (newNewsletter: Newsletter) => {
    setNewsletters(prev => [newNewsletter, ...prev]);
  };

  const handleDeleteNewsletter = async (id: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_MONGO_API_URL}/api/newsletters/${id}`);
      setNewsletters(prev => prev.filter(newsletter => newsletter._id !== id));
    } catch (err) {
      setError("Failed to delete newsletter.");
      console.error("Error deleting newsletter:", err);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2">Welcome back, {user.name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">
          Manage your AI-powered scientific newsletters
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
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
      </div>

      {/* Newsletter Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-lg p-4 border">
          <h3>Active Newsletters</h3>
          <p className="text-muted-foreground mt-1">{newsletters.length}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <h3>Total Issues</h3>
          <p className="text-muted-foreground mt-1">
            {newsletters.reduce((sum, n) => sum + n.totalIssues, 0)}
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
              onDelete={handleDeleteNewsletter}
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
    </div>
  );
}