import { Calendar, BookOpen, Hash, Eye, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useNavigate } from "react-router-dom";

interface Newsletter {
  _id: string; // MongoDB uses _id
  topic: string;
  description?: string;
  status: 'active' | 'inactive';
  rankingStrategy: 'author_based' | 'embedding_based';
  createdAt: string; // Changed from createdDate
  totalIssues: number;
  lastIssueDate?: string; // New field from aggregation
}

interface NewsletterCardProps {
  newsletter: Newsletter;
  onView: (newsletter: Newsletter) => void;
}

export function NewsletterCard({ newsletter, onView }: NewsletterCardProps) {
  const navigate = useNavigate();
  
  const handleCardClick = () => {
    onView(newsletter);
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/newsletters/${newsletter._id}/settings`);
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
            
            <span className="text-sm text-muted-foreground mt-2">
              Last issue: {formattedLastIssue}
            </span>
            
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge 
            variant={newsletter.status === 'active' ? "default" : "secondary"}
            className={newsletter.status === 'active' ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {newsletter.status}
          </Badge>
          <Badge variant="outline">
            {newsletter.rankingStrategy === 'author_based' ? 'Author Ranking' : 'Semantic Ranking'}
          </Badge>
        </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4 space-y-3">
        {newsletter.description && (
              <CardDescription className="mt-2 line-clamp-2">
                {newsletter.description}
              </CardDescription>
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
              className="gap-2 transition-opacity"
              onClick={handleSettingsClick}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onView(newsletter);
              }}
            >
              <Eye className="w-4 h-4" />
              View Issues
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}