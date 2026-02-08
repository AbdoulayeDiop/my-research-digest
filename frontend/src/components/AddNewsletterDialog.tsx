import { useState } from "react";
import { Plus, Info } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

import { useAxios } from "../lib/axios";

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
  onCreate: (newsletter: Newsletter) => Promise<void>;
  user: User;
}

export function AddNewsletterDialog({ onCreate, user }: AddNewsletterDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    topic: "",
    description: "",
    field: "",
  });
  const axios = useAxios();

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
        description: formData.description,
        field: formData.field,
        userId: user.sub,
        userEmail: user.email,
        userName: user.name,
      });
      onCreate(response.data);
      setOpen(false);
      setFormData({
        topic: "",
        description: "",
        field: "",
      });
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
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Scientific Newsletter</DialogTitle>
            <DialogDescription>
              Create a new AI-powered newsletter that will synthesize scientific papers weekly based on your topics of interest.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <Alert variant="default" className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4 text-primary" />
              <AlertTitle className="text-sm font-medium">Tips for better results:</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground mt-1 italic">
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Be Specific:</strong> The <strong>Topic</strong> is used directly for search. Use specific terms like "Transformer Architectures in NLP" instead of just "AI".</li>
                  <li><strong>Detailed Description:</strong> The <strong>Description</strong> helps the AI filter and analyze papers. Mention specific methodologies or sub-topics.</li>
                  <li><strong>Refine Regularly:</strong> If you get too many or too few papers, try adjusting the topic and description to be more or less specific.</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="grid gap-5 py-5">
            <div className="grid gap-3">
              <Label htmlFor="topic">Newsletter Topic</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => handleInputChange("topic", e.target.value)}
                placeholder="e.g., Mixed Data Clustering"
                required
                className="placeholder:text-foreground/60 !bg-muted/40"
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Brief description of what this newsletter will cover..."
                rows={3}
                className="placeholder:text-foreground/60 !bg-muted/40"
              />
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="field">Research Field (Optional)</Label>
              <Select value={formData.field || ""} onValueChange={(value) => handleInputChange("field", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select research field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Machine Learning">Machine Learning</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Artificial Intelligence">Artificial Intelligence</SelectItem>
                  <SelectItem value="Biotechnology">Biotechnology</SelectItem>
                  <SelectItem value="Medicine">Medicine</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Environmental Science">Environmental Science</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Neuroscience">Neuroscience</SelectItem>
                  <SelectItem value="Materials Science">Materials Science</SelectItem>
                  <SelectItem value="Data Science">Data Science</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
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