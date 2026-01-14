import { Search, Brain, Zap, Clock, Shield, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function FeaturesDeepDiveSection() {
  return (
    <section id="features" className="mx-auto px-6 py-20 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Under the Hood: How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our system uses a combination of data sourcing, AI ranking, and summarization to deliver your weekly digests.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 bg-card/50 backdrop-blur">
            <CardHeader className="text-center pb-4" withSeparator={false}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Automated Paper Sourcing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Leverages the Semantic Scholar API, which indexes billions of papers across all major scientific disciplines, to discover the latest publications.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/50 backdrop-blur">
            <CardHeader className="text-center pb-4" withSeparator={false}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>AI-Powered Search</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Uses a Large Language Model to generate multiple, diverse search queries from your topic, ensuring a more comprehensive and relevant search.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/50 backdrop-blur">
            <CardHeader className="text-center pb-4" withSeparator={false}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>AI-Powered Summarization</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Automatically generates comprehensive summaries with key findings, methodologies, and implications for your research area.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/50 backdrop-blur">
            <CardHeader className="text-center pb-4" withSeparator={false}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Consistent Weekly Digests</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Each newsletter is generated on a weekly schedule, ensuring you receive timely and consistent updates on your field.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/50 backdrop-blur">
            <CardHeader className="text-center pb-4" withSeparator={false}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Author-Based Quality Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                After an initial AI-powered filtering, papers are ranked by author reputation (citation counts, h-index) to prioritize impactful research.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/50 backdrop-blur">
            <CardHeader className="text-center pb-4" withSeparator={false}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>AI-Powered Relevance Filtering</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                An LLM acts as an expert screener, analyzing each paper to ensure it is a "must-read" for your specific topic, guaranteeing high relevance.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}