import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, Trash2, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Info, Lightbulb, ChevronDown, ChevronUp, Search, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { useAxios } from "../lib/axios";
import { toast } from "sonner";
import { Alert, AlertDescription } from "./ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface Newsletter {
  _id: string;
  topic: string;
  description: string;
  status: 'active' | 'inactive';
  rankingStrategy: 'author_based' | 'embedding_based';
  queries: string[];
  filters?: {
    venues: string[];
    publicationTypes: string[];
    minCitationCount: number;
    openAccessPdf: boolean;
  };
}

const PUBLICATION_TYPES = [
  'Review',
  'JournalArticle',
  'CaseReport',
  'ClinicalTrial',
  'Conference',
  'Dataset',
  'Editorial',
  'LettersAndComments',
  'MetaAnalysis',
  'News',
  'Study',
  'Book',
  'BookSection'
];

export function NewsletterSettings() {
  const { newsletterId } = useParams<{ newsletterId: string }>();
  const navigate = useNavigate();
  
  // Instance for Node Backend (default)
  const axiosNode = useAxios();
  
  // Instance for Python Backend
  const pythonApiUrl = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';
  const axiosPython = useAxios(pythonApiUrl);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingQueries, setIsGeneratingQueries] = useState(false);
  const [isTestingSearch, setIsTestingSearch] = useState(false);
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  useEffect(() => {
    fetchNewsletter()
  }, [newsletterId]);

  const fetchNewsletter = async () => {
    try {
      setIsLoading(true);
      const response = await axiosNode.get(`/newsletters/${newsletterId}`);
      // Ensure filters object exists
      const data = response.data;
      if (!data.filters) {
        data.filters = {
          venues: [],
          publicationTypes: [],
          minCitationCount: 0,
          openAccessPdf: false
        };
      }
      setNewsletter(data);
      return data;
    } catch (error) {
      console.error("Error fetching newsletter:", error);
      toast.error("Failed to load newsletter settings.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newsletter) return;
    try {
      setIsSaving(true);
      await axiosNode.put(`/newsletters/${newsletterId}`, {
        description: newsletter.description,
        status: newsletter.status,
        rankingStrategy: newsletter.rankingStrategy,
        queries: newsletter.queries,
        filters: newsletter.filters,
      });
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving newsletter:", error);
      toast.error("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSearch = async () => {
    if (!newsletter) return;
    try {
      setIsTestingSearch(true);
      setTestResults(null);
      
      const response = await axiosPython.post(`/test-search`, {
        queries: newsletter.queries,
        filters: {
          venues: newsletter.filters?.venues || [],
          publicationTypes: newsletter.filters?.publicationTypes || [],
          minCitationCount: newsletter.filters?.minCitationCount || 0,
          openAccessPdf: newsletter.filters?.openAccessPdf || false
        }
      });
      
      setTestResults(response.data.results);
      const totalFound = response.data.results.reduce((acc: number, res: any) => acc + res.count, 0);
      toast.success(`Search completed! Found ${totalFound} papers across all queries.`);
    } catch (error: any) {
      console.error("Error testing search:", error);
      toast.error(error.response?.data?.detail || "Failed to perform test search via Python service.");
    } finally {
      setIsTestingSearch(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axiosNode.delete(`/newsletters/${newsletterId}`);
      toast.success("Newsletter deleted successfully.");
      navigate("/");
    } catch (error) {
      console.error("Error deleting newsletter:", error);
      toast.error("Failed to delete newsletter.");
    }
  };

  const generateQueries = async (topic?: string, description?: string) => {
    // Use provided values or fallback to current state
    const targetTopic = topic || newsletter?.topic;
    const targetDescription = description || newsletter?.description;
    
    if (!targetTopic) {
      console.warn("Cannot generate queries: Topic is missing.");
      return;
    }
    
    try {
      setIsGeneratingQueries(true);
      const response = await axiosPython.post(`/generate-queries`, {
        topic: targetTopic,
        description: targetDescription || "",
      });

      if (newsletter) {
        setNewsletter({ ...newsletter, queries: response.data.queries });
      }
      toast.success("Search queries generated!");
    } catch (error) {
      console.error("Error generating queries:", error);
      toast.error("Failed to generate search queries.");
    } finally {
      setIsGeneratingQueries(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!newsletter) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-2xl font-bold">Newsletter not found</h2>
        <Button variant="link" onClick={() => navigate("/")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-6">
      
      {/* Tips Section */}
              
      {newsletter.status === 'inactive' && (
        // <p className="text-muted-foreground text-lg leading-relaxed mb-8">
        //   Configure and <strong>activate your newsletter below</strong> to start receiving personalized research digests directly in your inbox.
        // </p>
        <Alert className="bg-orange-300/5 border-orange-300/20 mb-8">
          <Info className="h-5 w-5" style={{ color: 'orange'}} />
          <AlertDescription className="text-sm">
            <p><strong>INACTIVE</strong><br/>Configure and activate your newsletter below to start receiving personalized research digests directly in your inbox.</p>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8">

        {/* General Settings */}
        <Card>
          <CardHeader className="pb-3" withSeparator={false}>
            <CardTitle>General Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="description">Description <span className="text-primary font-medium">(Recommended)</span></Label>
              <Textarea
                id="description"
                placeholder="Describe what this newsletter is about in detail to improve AI accuracy..."
                value={newsletter.description || ""}
                onChange={(e) => setNewsletter({ ...newsletter, description: e.target.value })}
                rows={4}
              />
              
              {/* Description tip */}
              <Alert className="bg-chart-2/5 border-chart-2/20">
                <Lightbulb className="h-5 w-5" style={{ color: 'var(--chart-2)'}} />
                <AlertDescription className="text-sm">
                  <p>The <strong>Description</strong> helps the AI generate better search queries and filter for relevance. A clear description ensures you only receive research tailored to your specific needs.</p>
                </AlertDescription>
              </Alert>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-base">Ranking Strategy</Label>
                <p className="text-sm text-muted-foreground">How should the AI prioritize found papers?</p>
              </div>
              <Select
                value={newsletter.rankingStrategy}
                onValueChange={(value: 'author_based' | 'embedding_based') => setNewsletter({ ...newsletter, rankingStrategy: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="author_based">Author Authority (Citation/H-Index based)</SelectItem>
                  <SelectItem value="embedding_based">Semantic Relevance (Embedding similarity)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground italic">
                {newsletter.rankingStrategy === 'author_based' 
                  ? "• Prioritizes papers from established researchers with high citation counts." 
                  : "• Prioritizes papers that are semantically closest to your topic and description."}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">
                  {newsletter.status === 'active' ? 'The newsletter is active' : 'Activate the newsletter'}
                </Label>
                <div className="text-sm text-muted-foreground">
                  {newsletter.status === 'active' 
                    ? 'The AI will scan for new research and send your digest every 7 days.' 
                    : 'Ready? Enable this to start receiving your automated weekly research digests.'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={newsletter.status === 'active' ? "default" : "secondary"}
                  className={newsletter.status === 'active' ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {newsletter.status === 'active' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  {newsletter.status.toUpperCase()}
                </Badge>
                <Switch
                  checked={newsletter.status === 'active'}
                  onCheckedChange={(checked) => setNewsletter({ ...newsletter, status: checked ? 'active' : 'inactive' })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Collapsible
          open={isAdvancedOpen}
          onOpenChange={setIsAdvancedOpen}
          className="border rounded-lg bg-card"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center justify-between w-full hover:bg-transparent h-20 px-6">
              <div className="text-left">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  Advanced Settings
                  <Badge variant="secondary" className="font-normal text-[10px] uppercase">Optional</Badge>
                </h3>
                <p className="text-sm text-muted-foreground">Fine-tune search queries, filters, and test your configuration.</p>
              </div>
              {isAdvancedOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-6 pb-6 space-y-8">
            <div className="pt-4 space-y-8">
              {/* Search Queries */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Search Queries</Label>
                    <p className="text-sm text-muted-foreground">These queries are used to search the Semantic Scholar database.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => generateQueries()} 
                    disabled={isGeneratingQueries}
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isGeneratingQueries ? 'animate-spin' : ''}`} />
                    {newsletter.queries?.length > 0 ? "Regenerate" : "Generate Queries"}
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {newsletter.queries?.length > 0 ? (
                    newsletter.queries.map((query, index) => (
                      <div key={index} className="flex gap-2">
                        <Badge variant="outline" className="h-9 px-3 shrink-0">{index + 1}</Badge>
                        <Input 
                          value={query} 
                          onChange={(e) => {
                            const newQueries = [...newsletter.queries];
                            newQueries[index] = e.target.value;
                            setNewsletter({ ...newsletter, queries: newQueries });
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/30">
                      No queries generated yet. Use the button above to generate optimized search queries.
                    </div>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="border-t pt-8 space-y-6">
                <div className="space-y-1">
                  <Label className="text-base">Search Filters</Label>
                  <p className="text-sm text-muted-foreground">Restrict search results by venue, type, and impact.</p>
                </div>

                <div className="grid gap-6">
                  {/* Venues */}
                  <div className="space-y-2">
                    <Label htmlFor="venues">Preferred Venues</Label>
                    <div className="text-xs text-muted-foreground mb-1">
                      Specific journals or conferences (comma-separated). e.g., ArXiv, Nature, ICML, NeurIPS
                    </div>
                    <Input
                      id="venues"
                      placeholder="e.g., ArXiv, Nature, ICML"
                      value={newsletter.filters?.venues.join(", ") || ""}
                      onChange={(e) => {
                        const venues = e.target.value.split(",").map(v => v.trim()).filter(v => v !== "");
                        setNewsletter({
                          ...newsletter,
                          filters: { ...newsletter.filters!, venues }
                        });
                      }}
                    />
                  </div>

                  {/* Publication Types */}
                  <div className="space-y-3">
                    <Label>Publication Types</Label>
                    <div className="text-xs text-muted-foreground mb-2">
                      Select the types of papers you want to include.
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {PUBLICATION_TYPES.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`type-${type}`}
                            checked={newsletter.filters?.publicationTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              const currentTypes = [...(newsletter.filters?.publicationTypes || [])];
                              let newTypes;
                              if (checked) {
                                newTypes = [...currentTypes, type];
                              } else {
                                newTypes = currentTypes.filter(t => t !== type);
                              }
                              setNewsletter({
                                ...newsletter,
                                filters: { ...newsletter.filters!, publicationTypes: newTypes }
                              });
                            }}
                          />
                          <Label
                            htmlFor={`type-${type}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {type.replace(/([A-Z])/g, ' $1').trim()}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Min Citations & Open Access */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="minCitationCount">Minimum Citation Count</Label>
                      <div className="text-xs text-muted-foreground mb-1">
                        Only include papers with at least this many citations.
                      </div>
                      <Input
                        id="minCitationCount"
                        type="number"
                        min="0"
                        value={newsletter.filters?.minCitationCount || 0}
                        onChange={(e) => {
                          setNewsletter({
                            ...newsletter,
                            filters: { ...newsletter.filters!, minCitationCount: parseInt(e.target.value) || 0 }
                          });
                        }}
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <div className="flex items-center justify-between p-3 border rounded-lg h-[56px]">
                        <div className="space-y-0.5">
                          <Label htmlFor="openAccess" className="cursor-pointer">Open Access Only</Label>
                          <div className="text-[10px] text-muted-foreground">Ensure a PDF is freely available.</div>
                        </div>
                        <Switch
                          id="openAccess"
                          checked={newsletter.filters?.openAccessPdf || false}
                          onCheckedChange={(checked) => {
                            setNewsletter({
                              ...newsletter,
                              filters: { ...newsletter.filters!, openAccessPdf: checked }
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Search Section */}
              <div className="border-t pt-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      Test Search
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Preview what papers the current queries and filters would find (last 7 days).
                    </p>
                  </div>
                  <Button 
                    onClick={handleTestSearch} 
                    disabled={isTestingSearch || newsletter.queries?.length === 0}
                    size="sm"
                    className="gap-2"
                  >
                    {isTestingSearch ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Run Test Search
                  </Button>
                </div>

                <Alert className="bg-primary/5 border-primary/20">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-xs text-muted-foreground">
                    <p>These are the raw papers retrieved from Semantic Scholar for each query <strong>before</strong> the AI filters them for relevance.</p>
                  </AlertDescription>
                </Alert>

                {isTestingSearch && (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Searching Semantic Scholar database...</p>
                  </div>
                )}

                {!isTestingSearch && testResults && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-sm font-medium">Results by Query</span>
                      <Button variant="ghost" size="sm" onClick={() => setTestResults(null)} className="text-xs h-7">Clear Results</Button>
                    </div>
                    
                    <ScrollArea className="h-[400px] w-full rounded-md border bg-muted/30 p-4">
                      <div className="space-y-8">
                        {testResults.map((group, groupIndex) => (
                          <div key={groupIndex} className="space-y-4">
                            <div className="flex items-center gap-2 sticky top-0 bg-transparent backdrop-blur-sm py-1 z-10 border-b">
                              <Badge variant="outline" className="bg-background text-primary border-primary/20">
                                Query {groupIndex + 1}
                              </Badge>
                              <span className="text-xs font-mono text-muted-foreground truncate italic">
                                "{group.query}"
                              </span>
                              <Badge variant="secondary" className="ml-auto text-[10px]">
                                {group.count < 5 ?group.count : `${group.count}+`} found
                              </Badge>
                            </div>

                            <div className="space-y-6 pl-4">
                              {group.papers && group.papers.length > 0 ? (
                                group.papers.map((paper: any, paperIndex: number) => (
                                  <div key={paper.paperId || paperIndex} className="space-y-2 pb-4 border-b last:border-0 last:pb-0">
                                    <div className="flex items-start justify-between gap-4">
                                      <h4 className="font-semibold text-sm leading-tight hover:text-primary transition-colors">
                                        {paper.title}
                                      </h4>
                                      {paper.url && (
                                        <a href={paper.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary shrink-0">
                                          <ExternalLink className="w-4 h-4" />
                                        </a>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                      {paper.publicationVenue?.name && (
                                        <Badge variant="outline" className="text-[10px] py-0 h-5">
                                          {paper.publicationVenue.name}
                                        </Badge>
                                      )}
                                      <span className="text-[10px] text-muted-foreground">
                                        {paper.publicationDate || paper.year}
                                      </span>
                                      {paper.citationCount !== undefined && (
                                        <span className="text-[10px] text-muted-foreground">
                                          • {paper.citationCount} citations
                                        </span>
                                      )}
                                    </div>
                                    {paper.abstract && (
                                      <p className="text-xs text-muted-foreground line-clamp-2 italic">
                                        {paper.abstract}
                                      </p>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground italic py-4">
                                  No papers found for this query in the last 7 days.
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {!isTestingSearch && !testResults && (
                  <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-lg bg-muted/20">
                    <Search className="w-10 h-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground max-w-[300px]">
                      Click the button above to verify your search configuration.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Save Changes */}
        <div className="flex justify-end py-6">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 min-w-[150px]" size="lg">
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h3>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader withSeparator={false}>
              <CardTitle className="text-base text-destructive">Delete this newsletter</CardTitle>
              <CardDescription>
                Once you delete a newsletter, there is no going back. All historical issues and papers will be permanently removed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Newsletter
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your newsletter
                      and all associated issues and papers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
