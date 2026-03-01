import { useState } from "react";
import { Plus, Lightbulb } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";

import { useAxios } from "../lib/axios";

import { useNavigate } from "react-router-dom";

interface User {
  _id: string; // MongoDB user ID
  sub?: string;
  name?: string;
  email?: string;
}

interface AddNewsletterDialogProps {
  user: User;
  onSuccess?: () => void;
}

export function AddNewsletterDialog({ user, onSuccess }: AddNewsletterDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    topic: "",
    description: "",
  });
  const axios = useAxios();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.topic) {
      setError("Please fill in the newsletter topic.");
      return;
    }

    try {
      setIsLoading(true);
      await axios.post(`/newsletters`, {
        topic: formData.topic,
        description: formData.description,
        userId: user.sub,
        userEmail: user.email,
        userName: user.name,
      });
      setOpen(false);
      setFormData({
        topic: "",
        description: "",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      navigate(`/`);
    } catch (err) {
      setError("Failed to create newsletter. Please try again.");
      console.error("Error creating newsletter:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Newsletter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Scientific Newsletter</DialogTitle>
            <DialogDescription>
              Enter the topic and description for your new AI-powered research digest.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-5">
            <div className="grid gap-3">
              <Label htmlFor="topic">Newsletter Topic</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => handleInputChange("topic", e.target.value)}
                placeholder="e.g., Mixed Data Clustering"
                required
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="description">Description <span className="text-primary font-medium text-xs">(Recommended)</span></Label>
              <Textarea
                id="description"
                placeholder="Describe what this newsletter is about in detail to improve AI accuracy..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
              />

              <Alert className="bg-chart-2/5 border-chart-2/20 py-2">
                <Lightbulb className="h-4 w-4" style={{ color: 'var(--chart-2)'}} />
                <AlertDescription className="text-[11px] leading-relaxed">
                  <p>The <strong>Description</strong> helps the AI generate better search queries and filter for relevance. A clear description ensures you only receive research tailored to your specific needs.</p>
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <DialogFooter>
            {error && <p className="text-destructive text-sm mr-auto">{error}</p>}
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.topic || isLoading}>
              {isLoading ? "Creating..." : "Create Newsletter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}