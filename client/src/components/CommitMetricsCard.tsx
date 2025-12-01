import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GitCommit,
  Plus,
  Minus,
  Users,
  Code,
  TrendingUp
} from "lucide-react";

interface CommitMetrics {
  total_commits_last_7d: number;
  avg_commit_size: number;
  total_lines_added: number;
  total_lines_deleted: number;
  lines_added_deleted_ratio: number;
  commits_per_week: number;
  bus_factor: number;
  total_contributors: number;
  calculated_at: string;
}

interface CommitMetricsCardProps {
  metrics: CommitMetrics | null;
  loading: boolean;
}

export const CommitMetricsCard = ({ metrics, loading }: CommitMetricsCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Commit Health Metrics</CardTitle>
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
          <CardTitle className="text-lg">Commit Health Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No commit metrics available. Click "Refresh Data" to calculate metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const lastUpdated = new Date(metrics.calculated_at).toLocaleString();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Commit Health Metrics (Last 7 Days)</CardTitle>
          <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <GitCommit className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Total Commits</span>
              </div>
              <p className="text-2xl font-bold">{metrics.commits_per_week}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Contributors</span>
              </div>
              <p className="text-2xl font-bold">{metrics.total_contributors}</p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            {/* Commit Metrics */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">Commit Metrics</h4>
              
              {/* Avg Commit Size */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Avg Commit Size</p>
                    <p className="text-xs text-muted-foreground">{metrics.avg_commit_size.toFixed(0)} lines changed</p>
                  </div>
                </div>
              </div>

              {/* Lines Added/Deleted */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <Plus className="h-4 w-4 text-green-500" />
                    <Minus className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Lines Added/Deleted</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">+{metrics.total_lines_added}</span>
                      {" / "}
                      <span className="text-red-600">-{metrics.total_lines_deleted}</span>
                      {" (ratio: "}{metrics.lines_added_deleted_ratio.toFixed(2)}{")"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Commits Per Week */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Commits Per Week</p>
                    <p className="text-xs text-muted-foreground">{metrics.commits_per_week} commits</p>
                  </div>
                </div>
              </div>

              {/* Bus Factor */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Bus Factor</p>
                    <p className="text-xs text-muted-foreground">
                      {metrics.bus_factor} contributor{metrics.bus_factor !== 1 ? 's' : ''} with {'>'} 50% commits
                    </p>
                  </div>
                </div>
                {metrics.bus_factor <= 1 && (
                  <Badge variant="destructive">Risk</Badge>
                )}
                {metrics.bus_factor > 1 && metrics.bus_factor <= 2 && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Warning</Badge>
                )}
                {metrics.bus_factor > 2 && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Healthy</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
