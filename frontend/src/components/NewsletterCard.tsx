import { Calendar, BookOpen, Settings, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardAction } from "./ui/card";
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

  const displayDate = newsletter.lastIssueDate || newsletter.createdAt;
  const formattedDisplayDate = new Date(displayDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const dateLabel = newsletter.lastIssueDate ? "Last issue" : "Created";

  return (
    <Card 
      className="h-full hover:shadow-lg transition-shadow duration-300 cursor-pointer group bg-card/4 hover:bg-card/50 overflow-hidden relative"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-0 pt-5 px-5" withSeparator={false}>
        <CardTitle className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
          {newsletter.topic}
        </CardTitle>
        <CardAction>
          <Badge
            variant={newsletter.status === 'active' ? "success" : "secondary"}
          >
            {newsletter.status}
          </Badge>
        </CardAction>
      </CardHeader>
      
      <CardContent className="pb-3 px-5 space-y-3">
        {newsletter.description && (
          <CardDescription className="line-clamp-2 text-sm leading-relaxed">
            {newsletter.description}
          </CardDescription>
        )}
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{newsletter.totalIssues || 0} issues</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{dateLabel}: {formattedDisplayDate}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="mt-auto border-t border-muted/20 bg-muted/5">
        <div className="flex justify-between items-center w-full">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-2 text-muted-foreground"
            onClick={handleSettingsClick}
          >
            <Settings className="w-4 h-4" />
            <span className="text-xs font-medium">Settings</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="group/btn gap-2 text-primary font-medium hover:bg-primary/5 px-2"
            onClick={(e) => {
              e.stopPropagation();
              onView(newsletter);
            }}
          >
            View Issues
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}