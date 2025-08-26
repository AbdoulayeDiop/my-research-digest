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
import axios from "axios";

interface Issue {
  _id?: string;
  title: string;
  publicationDate?: string;
  introduction?: string;
  conclusion?: string;
  papers?: string[];
  status?: "published" | "draft";
}

interface AddIssueDialogProps {
  newsletterId: string;
  onCreate: (issue: Issue) => void;
}

export function AddIssueDialog({ newsletterId, onCreate }: AddIssueDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title) {
      setError("Please fill in the title.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_MONGO_API_URL}/api/newsletters/${newsletterId}/issues`, {
        title: title,
        status: 'draft',
      });
      onCreate(response.data);
      setOpen(false);
      setTitle("");
    } catch (err) {
      setError("Failed to create issue. Please try again.");
      console.error("Error creating issue:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create New Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Issue</DialogTitle>
            <DialogDescription>
              Create a new draft issue for your newsletter. The content will be generated automatically.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Issue Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., August 2024 Digest"
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            {error && <p className="text-destructive text-sm mr-auto">{error}</p>}
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Issue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}