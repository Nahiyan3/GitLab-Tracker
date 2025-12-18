import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Target, TrendingDown, TrendingUp } from "lucide-react";

interface MilestoneMetrics {
  max_issues: number;
  min_issues: number;
  avg_issues: number;
  total_milestones: number;
  milestone_with_max_issues: string | null;
  milestone_with_min_issues: string | null;
  calculated_at: string;
}

interface MilestoneMetricsCardProps {
  metrics: MilestoneMetrics | null;
  loading: boolean;
}

export const MilestoneMetricsCard = ({ metrics, loading }: MilestoneMetricsCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Milestone Metrics</CardTitle>
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
          <CardTitle className="text-lg">Active Milestone Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No metrics available. Click "Refresh Data" to calculate metrics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const lastUpdated = new Date(metrics.calculated_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Active Milestone Metrics</CardTitle>
          <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>
        </div>
      </CardHeader>
      <CardContent>
        {metrics.total_milestones === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No active milestones found (not expired)</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Max Issues</span>
                </div>
                <p className="text-2xl font-bold">{metrics.max_issues}</p>
                {metrics.milestone_with_max_issues && (
                  <p className="text-xs text-muted-foreground truncate" title={metrics.milestone_with_max_issues}>
                    {metrics.milestone_with_max_issues}
                  </p>
                )}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Min Issues</span>
                </div>
                <p className="text-2xl font-bold">{metrics.min_issues}</p>
                {metrics.milestone_with_min_issues && (
                  <p className="text-xs text-muted-foreground truncate" title={metrics.milestone_with_min_issues}>
                    {metrics.milestone_with_min_issues}
                  </p>
                )}
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Avg Issues</span>
                </div>
                <p className="text-2xl font-bold">{metrics.avg_issues.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">
                  across {metrics.total_milestones} milestone{metrics.total_milestones !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Summary Info */}
            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                  <strong className="text-foreground">{metrics.total_milestones}</strong> active milestone{metrics.total_milestones !== 1 ? 's' : ''} (not expired)
                </p>
                <p className="text-xs">
                  These metrics help you understand workload distribution across milestones and identify potential bottlenecks or under-planned sprints.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
