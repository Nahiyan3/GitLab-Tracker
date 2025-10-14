import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

export const InsightsSummary = () => {
  return (
    <Card className="p-6 mb-6 border-2">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Overall Project Health</h2>
          <Badge variant="high" className="text-sm">
            Excellent - 87/100
          </Badge>
        </div>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <div className="font-semibold">5</div>
              <div className="text-muted-foreground">Strong</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-warning" />
            <div>
              <div className="font-semibold">2</div>
              <div className="text-muted-foreground">Improving</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <div className="font-semibold">1</div>
              <div className="text-muted-foreground">Needs Attention</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="prose prose-sm max-w-none">
        <p className="text-muted-foreground leading-relaxed">
          Your project demonstrates strong code quality and excellent CI stability. 
          The team shows high collaboration efficiency with consistent commit patterns. 
          Issue resolution time has improved by 23% this month. 
          Primary area for improvement: test coverage in recently added modules.
        </p>
      </div>
    </Card>
  );
};
