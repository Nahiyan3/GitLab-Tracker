import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  GitMerge,
  MessageSquare,
  Users,
  AlertCircle,
  TrendingUp
} from "lucide-react";

interface MRMetrics {
  total_open_mrs: number;
  total_merged_mrs: number;
  mrs_merged_last_7d: number;
  mrs_merged_last_30d: number;
  mrs_opened_last_30d: number;
  avg_merge_time_hours: number;
  avg_merge_time_days: number;
  avg_review_comments_per_mr: number;
  revert_rate_percent: number;
  stale_mrs_count: number;
  avg_reviewers_per_mr: number;
  closure_rate_percent: number;
  merge_velocity_alert_level: string | null;
  merge_time_alert_level: string | null;
  revert_rate_alert_level: string | null;
  stale_mrs_alert_level: string | null;
  calculated_at: string;
}

interface MRMetricsCardProps {
  metrics: MRMetrics | null;
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

export const MRMetricsCard = ({ metrics, loading }: MRMetricsCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">MR Health Metrics</CardTitle>
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
          <CardTitle className="text-lg">MR Health Metrics</CardTitle>
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
          <CardTitle className="text-lg">MR Health Metrics</CardTitle>
          <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <GitMerge className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Open MRs</span>
              </div>
              <p className="text-2xl font-bold">{metrics.total_open_mrs}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Merged (Total)</span>
              </div>
              <p className="text-2xl font-bold">{metrics.total_merged_mrs}</p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            {/* Tier 1: Critical Metrics */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">Critical Metrics</h4>
              
              {/* Merge Velocity */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Merge Velocity (30d)</p>
                    <p className="text-xs text-muted-foreground">{metrics.mrs_merged_last_30d} MRs merged</p>
                  </div>
                </div>
                {getAlertBadge(metrics.merge_velocity_alert_level)}
              </div>

              {/* Merge Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Avg Merge Time</p>
                    <p className="text-xs text-muted-foreground">{metrics.avg_merge_time_hours.toFixed(1)} hours</p>
                  </div>
                </div>
                {getAlertBadge(metrics.merge_time_alert_level)}
              </div>

              {/* Review Comments */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Avg Review Comments</p>
                    <p className="text-xs text-muted-foreground">{metrics.avg_review_comments_per_mr.toFixed(1)} per MR</p>
                  </div>
                </div>
              </div>

              {/* Revert Rate */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Revert Rate</p>
                    <p className="text-xs text-muted-foreground">{metrics.revert_rate_percent.toFixed(1)}%</p>
                  </div>
                </div>
                {getAlertBadge(metrics.revert_rate_alert_level)}
              </div>
            </div>

            {/* Tier 2: Important Metrics */}
            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">Additional Metrics</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Stale MRs</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">{metrics.stale_mrs_count}</p>
                    {getAlertBadge(metrics.stale_mrs_alert_level)}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Avg Reviewers</p>
                  <p className="text-lg font-semibold">{metrics.avg_reviewers_per_mr.toFixed(1)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Closure Rate (30d)</p>
                  <p className="text-lg font-semibold">{metrics.mrs_merged_last_30d}/{metrics.mrs_opened_last_30d}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
