import { Calendar, BookOpen, Hash, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface Newsletter {
  _id: string; // MongoDB uses _id
  topic: string;
  description?: string;
  field?: string;
  createdAt: string; // Changed from createdDate
  totalIssues: number;
  lastIssueDate?: string; // New field from aggregation
}

interface NewsletterCardProps {
  newsletter: Newsletter;
  onDelete: (id: string) => void;
  onView: (newsletter: Newsletter) => void;
}

export function NewsletterCard({ newsletter, onDelete, onView }: NewsletterCardProps) {
  const handleCardClick = () => {
    onView(newsletter);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when delete button is clicked
    onDelete(newsletter._id);
  };

  const formattedCreatedAt = new Date(newsletter.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedLastIssue = newsletter.lastIssueDate
    ? new Date(newsletter.lastIssueDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'No issues published yet';

  return (
    <Card 
      className="h-full shadow-md hover:shadow-lg transition-shadow cursor-pointer group bg-card/70"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
              {newsletter.topic}
            </CardTitle>
            {newsletter.description && (
              <CardDescription className="mt-2 line-clamp-2">
                {newsletter.description}
              </CardDescription>
            )}
            <span className="text-sm text-muted-foreground mt-2">
              Last issue: {formattedLastIssue}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4 space-y-3">
        {newsletter.field && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Hash className="w-4 h-4" />
            <Badge variant="secondary" className="shrink-0">
              {newsletter.field}
            </Badge>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="w-4 h-4" />
          <span>{newsletter.totalIssues || 0} issues published</span>
        </div>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Created: {formattedCreatedAt}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 mt-auto">
        <div className="flex justify-end items-center w-full">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onView(newsletter);
              }}
            >
              <Eye className="w-4 h-4" />
              View Issues
            </Button>
            <Button
              size="sm"
              onClick={handleDeleteClick}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}