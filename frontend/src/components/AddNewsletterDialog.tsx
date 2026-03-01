import { useState } from "react";
import { Plus } from "lucide-react";
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

import { useAxios } from "../lib/axios";

import { useNavigate } from "react-router-dom";

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

interface AddNewsletterDialogProps {
  user: User;
}

export function AddNewsletterDialog({ user }: AddNewsletterDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    topic: "",
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
      const response = await axios.post(`/newsletters`, {
        topic: formData.topic,
        userId: user.sub,
        userEmail: user.email,
        userName: user.name,
      });
      setOpen(false);
      setFormData({
        topic: "",
      });
      navigate(`/newsletters/${response.data._id}/settings`);
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
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Scientific Newsletter</DialogTitle>
            <DialogDescription>
              Enter the topic for your new AI-powered research digest. You can configure more settings after creation.
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