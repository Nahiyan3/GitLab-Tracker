import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RefreshCcw, 
  Bug, 
  TrendingUp,
  AlertCircle,
  Link2
} from "lucide-react";

interface IssueMetrics {
  total_open_issues: number;
  total_closed_issues: number;
  issues_closed_last_7d: number;
  issues_closed_last_30d: number;
  avg_cycle_time_days: number;
  reopen_rate_percent: number;
  bug_ratio_percent: number;
  stale_issues_count: number;
  critical_issues_open: number;
  issue_mr_link_rate_percent: number;
  velocity_alert_level: string | null;
  cycle_time_alert_level: string | null;
  reopen_rate_alert_level: string | null;
  bug_ratio_alert_level: string | null;
  calculated_at: string;
}

interface IssueMetricsCardProps {
  metrics: IssueMetrics | null;
  loading: boolean;
}

const getAlertBadge = (level: string | null) => {
  if (!level || level === 'NORMAL') {
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Normal</Badge>;
  }
  if (level === 'WARNING') {
    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Warning</Badge>;
  }
  if (level === 'RED_ALERT') {
    return <Badge variant="destructive">Alert</Badge>;
  }
  return null;
};

export const IssueMetricsCard = ({ metrics, loading }: IssueMetricsCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Issue Health Metrics</CardTitle>
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
          <CardTitle className="text-lg">Issue Health Metrics</CardTitle>
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
          <CardTitle className="text-lg">Issue Health Metrics</CardTitle>
          <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">Open Issues</span>
              </div>
              <p className="text-2xl font-bold">{metrics.total_open_issues}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Closed (Total)</span>
              </div>
              <p className="text-2xl font-bold">{metrics.total_closed_issues}</p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            {/* Tier 1: Critical Metrics */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">Critical Metrics</h4>
              
              {/* Velocity */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Velocity (30d)</p>
                    <p className="text-xs text-muted-foreground">{metrics.issues_closed_last_30d} issues closed</p>
                  </div>
                </div>
                {getAlertBadge(metrics.velocity_alert_level)}
              </div>

              {/* Cycle Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Avg Cycle Time</p>
                    <p className="text-xs text-muted-foreground">{metrics.avg_cycle_time_days.toFixed(1)} days</p>
                  </div>
                </div>
                {getAlertBadge(metrics.cycle_time_alert_level)}
              </div>

              {/* Reopen Rate */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCcw className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Reopen Rate</p>
                    <p className="text-xs text-muted-foreground">{metrics.reopen_rate_percent.toFixed(1)}%</p>
                  </div>
                </div>
                {getAlertBadge(metrics.reopen_rate_alert_level)}
              </div>

              {/* Bug Ratio */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Bug Ratio</p>
                    <p className="text-xs text-muted-foreground">{metrics.bug_ratio_percent.toFixed(1)}%</p>
                  </div>
                </div>
                {getAlertBadge(metrics.bug_ratio_alert_level)}
              </div>
            </div>

            {/* Tier 2: Important Metrics */}
            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">Additional Metrics</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Stale Issues</p>
                  <p className="text-lg font-semibold">{metrics.stale_issues_count}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Critical Open</p>
                  <p className="text-lg font-semibold">{metrics.critical_issues_open}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">MR Link Rate</p>
                  <p className="text-lg font-semibold">{metrics.issue_mr_link_rate_percent.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
