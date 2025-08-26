import { Sparkles, Database, Star, Brain } from "lucide-react";
import { Card } from "./ui/card";

export function BenefitsSection() {
  return (
    <section className="container mx-auto px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Why Choose My Research Digest?
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Completely Free Forever</h3>
                  <p className="text-muted-foreground">
                    No subscriptions, no hidden fees, no credit card required. 
                    Access cutting-edge research curation without any cost.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Comprehensive Coverage</h3>
                  <p className="text-muted-foreground">
                    Automatically searches across arXiv, Semantic Scholar, PubMed, 
                    and other major scientific repositories for the latest papers.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Quality Over Quantity</h3>
                  <p className="text-muted-foreground">
                    Instead of overwhelming you with hundreds of papers, our AI carefully 
                    selects the 5 most relevant and impactful studies each week.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex flex-col items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">AI-Powered Analysis</h3>
                  <p className="text-muted-foreground">
                    Each paper is automatically analyzed and synthesized, providing you 
                    with clear summaries, key findings, and research implications.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">ML</span>
                </div>
                <div>
                  <h4 className="font-semibold">Machine Learning Weekly</h4>
                  <p className="text-sm text-muted-foreground">28 issues • Last updated: 2 days ago</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Weekly digest featuring the top 5 machine learning papers from arXiv, 
                with AI-generated summaries and key insights.
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">BT</span>
                </div>
                <div>
                  <h4 className="font-semibold">Biotech Innovations</h4>
                  <p className="text-sm text-muted-foreground">15 issues • Last updated: 4 days ago</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Curated selection of breakthrough biotechnology research, 
                gene therapy advances, and medical innovations.
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">QC</span>
                </div>
                <div>
                  <h4 className="font-semibold">Quantum Computing</h4>
                  <p className="text-sm text-muted-foreground">22 issues • Last updated: 1 day ago</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Latest quantum computing research, algorithm developments, 
                and hardware breakthroughs from leading institutions.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
