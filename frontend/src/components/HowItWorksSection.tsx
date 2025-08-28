import { Search, Database, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="container mx-auto px-6 py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How My Research Digest Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From research keywords to curated insights in three automated steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center border-0 bg-card/50 backdrop-blur">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                1
              </div>
              <CardTitle>Set Your Research Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Define your research interests with keywords and topics. 
                Our AI will automatically search across major scientific databases.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-0 bg-card/50 backdrop-blur">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Database className="w-8 h-8 text-primary" />
              </div>
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                2
              </div>
              <CardTitle>AI Discovers & Selects</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Our AI scans arXiv, Semantic Scholar, and other major archives to find 
                the most relevant papers, then selects the top 5 for your weekly digest.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-0 bg-card/50 backdrop-blur">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                3
              </div>
              <CardTitle>Receive Your Digest</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Every week, get a comprehensive newsletter with AI-generated summaries, 
                key insights, and direct links to the full papers.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
