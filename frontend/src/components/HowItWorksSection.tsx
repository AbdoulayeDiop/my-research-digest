import { Search, Database, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mx-auto px-6 py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The Curation Process
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From research keywords to curated insights in three automated steps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center border-0 bg-card/50 backdrop-blur">
            <CardHeader className="pb-4" withSeparator={false}>
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>1. Define Your Scope</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Specify your research interests using keywords. Our system then automatically scans major scientific databases like arXiv and Semantic Scholar.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-0 bg-card/50 backdrop-blur">
            <CardHeader className="pb-4" withSeparator={false}>
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Database className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>2. Automated Search & Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                The tool finds relevant papers and ranks them based on relevance, citation counts, and author h-index to select the top 5 for your weekly digest.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-0 bg-card/50 backdrop-blur">
            <CardHeader className="pb-4" withSeparator={false}>
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>3. Get Your Weekly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Receive a weekly email with AI-generated summaries, key findings, and direct links to the full papers, keeping you informed without the noise.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}