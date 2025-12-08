import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle,
  Bug,
  Gauge,
  Copy,
  TrendingUp,
  FileCode
} from "lucide-react";

interface SonarMaintainabilityMetrics {
  maintainability_high: number;
  maintainability_blocker: number;
  technical_debt_ratio: number;
  maintainability_rating: string;
  code_smells_total: number;
  code_smells_new: number;
  cyclomatic_complexity: number;
  cognitive_complexity: number;
  duplicated_code_percentage: number;
  duplicated_lines_new: number;
  calculated_at: string;
}

interface SonarMaintainabilityCardProps {
  metrics: SonarMaintainabilityMetrics | null;
  loading: boolean;
}

export const SonarMaintainabilityCard = ({ metrics, loading }: SonarMaintainabilityCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SonarQube Maintainability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SonarQube Maintainability</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No maintainability metrics available. Click "Refresh Data" to fetch metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const lastUpdated = new Date(metrics.calculated_at).toLocaleString();

  // Helper to get rating badge color
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'A': return 'bg-green-500';
      case 'B': return 'bg-lime-500';
      case 'C': return 'bg-yellow-500';
      case 'D': return 'bg-orange-500';
      case 'E': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Helper to get priority issues badge
  const getPriorityBadge = () => {
    const total = metrics.maintainability_high + metrics.maintainability_blocker;
    if (total === 0) return <Badge variant="outline" className="bg-green-50">Healthy</Badge>;
    if (total <= 5) return <Badge variant="outline" className="bg-yellow-50">Warning</Badge>;
    return <Badge variant="destructive">Risk</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">SonarQube Maintainability</CardTitle>
          <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Priority Issues & Rating */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Priority Issues</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">
                  {metrics.maintainability_high + metrics.maintainability_blocker}
                </p>
                {getPriorityBadge()}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.maintainability_high} High, {metrics.maintainability_blocker} Blocker
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getRatingColor(metrics.maintainability_rating)} text-white text-xl px-3 py-1`}>
                  {metrics.maintainability_rating}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Debt: {metrics.technical_debt_ratio.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            {/* Code Smells */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">Code Smells</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Total Code Smells</p>
                    <p className="text-xs text-muted-foreground">{metrics.code_smells_total.toLocaleString()} issues found</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">New Code Smells</p>
                    <p className="text-xs text-muted-foreground">{metrics.code_smells_new.toLocaleString()} in new code</p>
                  </div>
                </div>
                <Badge variant={metrics.code_smells_new > 100 ? "destructive" : "outline"} />
              </div>
            </div>

            {/* Complexity */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">Complexity</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Cyclomatic Complexity</p>
                    <p className="text-xs text-muted-foreground">{metrics.cyclomatic_complexity.toLocaleString()} total paths</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-indigo-500" />
                  <div>
                    <p className="text-sm font-medium">Cognitive Complexity</p>
                    <p className="text-xs text-muted-foreground">{metrics.cognitive_complexity.toLocaleString()} difficulty score</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Duplication */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">Code Duplication</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Copy className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">Duplicated Code</p>
                    <p className="text-xs text-muted-foreground">{metrics.duplicated_code_percentage.toFixed(1)}% of codebase</p>
                  </div>
                </div>
                <Badge variant={metrics.duplicated_code_percentage > 5 ? "destructive" : "outline"} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Copy className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">New Code Duplication</p>
                    <p className="text-xs text-muted-foreground">{metrics.duplicated_lines_new.toFixed(2)}% in new code</p>
                  </div>
                </div>
                <Badge variant={metrics.duplicated_lines_new > 3 ? "destructive" : "outline"} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
