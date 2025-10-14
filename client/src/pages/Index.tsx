import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3 } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-8 px-4">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-4">
            <BarChart3 className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Project Intelligence
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered insights to optimize your development workflow and project health
          </p>
        </div>
        
        <Link to="/insights">
          <Button size="lg" className="group">
            View Project Insights
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
