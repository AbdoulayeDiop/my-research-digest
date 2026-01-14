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
            From research keywords to curated insights in four automated steps.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center border-0 bg-card/50 backdrop-blur">
            <CardHeader className="pb-4" withSeparator={false}>
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>1. Define Your Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Specify your research interests with keywords and a brief description. Our AI then intelligently generates diverse search queries.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-0 bg-card/50 backdrop-blur">
            <CardHeader className="pb-4" withSeparator={false}>
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Database className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>2. Intelligent Paper Discovery</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Our system uses the AI-generated queries to scan major scientific databases like Semantic Scholar, retrieving a broad set of relevant papers.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-0 bg-card/50 backdrop-blur">
            <CardHeader className="pb-4" withSeparator={false}>
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-primary" /> {/* Using Mail icon temporarily, can be changed */}
              </div>
              <CardTitle>3. AI-Powered Relevance Filtering</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                A Large Language Model acts as an expert screener, meticulously filtering papers to select only the "must-reads" highly relevant to your topic.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center border-0 bg-card/50 backdrop-blur">
            <CardHeader className="pb-4" withSeparator={false}>
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-primary" /> {/* Using Mail icon temporarily, can be changed */}
              </div>
              <CardTitle>4. Smart Ranking & Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Selected papers are ranked by author impact and then summarized by AI. Finally, a curated digest is delivered weekly to your inbox.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground">
            For a more detailed breakdown of our paper search and ranking strategy,
            {' '}
            <a
              href="https://github.com/AbdoulayeDiop/my-research-digest?tab=readme-ov-file#-how-it-works-the-paper-search-and-ranking-strategy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              check out our documentation on GitHub
            </a>.
          </p>
        </div>
      </div>
    </section>
  );
}