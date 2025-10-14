import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download } from "lucide-react";
import { InsightsSummary } from "@/components/InsightsSummary";
import { InsightsTable } from "@/components/InsightsTable";
import { toast } from "@/hooks/use-toast";

const ProjectInsights = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleReanalyze = async () => {
    setIsAnalyzing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLastUpdated(new Date());
    setIsAnalyzing(false);
    toast({
      title: "Analysis complete",
      description: "Project insights have been updated with the latest data.",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your report is being prepared for download.",
    });
    // Export logic would go here
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Project Insights
            </h1>
            <p className="text-sm text-muted-foreground">
              AI-powered analysis • Last updated {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleReanalyze}
              disabled={isAnalyzing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Re-analyze
            </Button>
            <Button onClick={handleExport} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        <InsightsSummary />

        {/* Insights Table */}
        <InsightsTable />
      </div>
    </div>
  );
};

export default ProjectInsights;
