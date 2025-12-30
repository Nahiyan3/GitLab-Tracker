import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, GitMerge, AlertTriangle, Clock } from "lucide-react";

interface DoraMetricsOverviewCardProps {
  metrics: any;
  loading: boolean;
}

export const DoraMetricsOverviewCard = ({ metrics, loading }: DoraMetricsOverviewCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            DORA Metrics (This Week: Sun-Sat)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
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
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            DORA Metrics (This Week: Sun-Sat)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Activity className="h-12 w-12 mb-4 opacity-50" />
            <p>No DORA metrics data available</p>
            <p className="text-sm">Start logging deployment data to see metrics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Helper function to get performance badge
  const getPerformanceBadge = (metric: string, value: any) => {
    if (metric === 'deployment_frequency') {
      const weekly = value.deployments_per_week || 0;
      if (weekly >= 7) return { label: 'Elite', variant: 'default' as const, color: 'text-green-600' };
      if (weekly >= 1) return { label: 'High', variant: 'secondary' as const, color: 'text-blue-600' };
      if (weekly > 0) return { label: 'Medium', variant: 'outline' as const, color: 'text-yellow-600' };
      return { label: 'Low', variant: 'destructive' as const, color: 'text-red-600' };
    }

    if (metric === 'lead_time') {
      const hours = value.avg_lead_time_hours || 0;
      if (hours === 0) return { label: 'No Data', variant: 'outline' as const, color: 'text-gray-600' };
      if (hours < 24) return { label: 'Elite', variant: 'default' as const, color: 'text-green-600' };
      if (hours < 168) return { label: 'High', variant: 'secondary' as const, color: 'text-blue-600' };
      if (hours < 720) return { label: 'Medium', variant: 'outline' as const, color: 'text-yellow-600' };
      return { label: 'Low', variant: 'destructive' as const, color: 'text-red-600' };
    }

    if (metric === 'change_failure_rate') {
      const rate = value.failure_rate_percent || 0;
      if (rate === 0) return { label: 'Elite', variant: 'default' as const, color: 'text-green-600' };
      if (rate < 15) return { label: 'High', variant: 'secondary' as const, color: 'text-blue-600' };
      if (rate < 30) return { label: 'Medium', variant: 'outline' as const, color: 'text-yellow-600' };
      return { label: 'Low', variant: 'destructive' as const, color: 'text-red-600' };
    }

    if (metric === 'time_to_restore') {
      const hours = value.avg_restore_time_hours || 0;
      if (hours === 0) return { label: 'No Data', variant: 'outline' as const, color: 'text-gray-600' };
      if (hours < 1) return { label: 'Elite', variant: 'default' as const, color: 'text-green-600' };
      if (hours < 24) return { label: 'High', variant: 'secondary' as const, color: 'text-blue-600' };
      if (hours < 168) return { label: 'Medium', variant: 'outline' as const, color: 'text-yellow-600' };
      return { label: 'Low', variant: 'destructive' as const, color: 'text-red-600' };
    }

    return { label: 'Unknown', variant: 'outline' as const, color: 'text-gray-600' };
  };

  // Format time
  const formatTime = (hours: number) => {
    if (hours === 0) return '0h';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  const deploymentFreq = metrics.deployment_frequency;
  const leadTime = metrics.lead_time;
  const changeFailure = metrics.change_failure_rate;
  const timeToRestore = metrics.time_to_restore;

  const deploymentBadge = getPerformanceBadge('deployment_frequency', deploymentFreq);
  const leadTimeBadge = getPerformanceBadge('lead_time', leadTime);
  const changeFailureBadge = getPerformanceBadge('change_failure_rate', changeFailure);
  const timeToRestoreBadge = getPerformanceBadge('time_to_restore', timeToRestore);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          DORA Metrics (This Week: Sun-Sat)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Deployment Frequency */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <GitMerge className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Deployment Frequency</h3>
              </div>
              <Badge variant={deploymentBadge.variant}>{deploymentBadge.label}</Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Deployments:</span>
                <span className={`font-semibold ${deploymentBadge.color}`}>
                  {deploymentFreq.total_deployments}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Production:</span>
                <span className="font-medium">{deploymentFreq.production_deployments}</span>
              </div>
            </div>
          </div>

          {/* Lead Time for Changes */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Lead Time for Changes</h3>
              </div>
              <Badge variant={leadTimeBadge.variant}>{leadTimeBadge.label}</Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Changes:</span>
                <span className="font-medium">{leadTime.total_changes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Time:</span>
                <span className={`font-semibold ${leadTimeBadge.color}`}>
                  {formatTime(leadTime.avg_lead_time_hours)}
                </span>
              </div>
            </div>
          </div>

          {/* Change Failure Rate */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold">Change Failure Rate</h3>
              </div>
              <Badge variant={changeFailureBadge.variant}>{changeFailureBadge.label}</Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Failed Deployments:</span>
                <span className="font-medium">{changeFailure.failed_deployments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Failure Rate:</span>
                <span className={`font-semibold ${changeFailureBadge.color}`}>
                  {changeFailure.failure_rate_percent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Time to Restore Service */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold">Time to Restore Service</h3>
              </div>
              <Badge variant={timeToRestoreBadge.variant}>{timeToRestoreBadge.label}</Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Incidents:</span>
                <span className="font-medium">{timeToRestore.total_incidents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Time:</span>
                <span className={`font-semibold ${timeToRestoreBadge.color}`}>
                  {formatTime(timeToRestore.avg_restore_time_hours)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          <p>DORA metrics based on current calendar week (Sunday to Saturday). Performance levels: Elite, High, Medium, Low.</p>
        </div>
      </CardContent>
    </Card>
  );
};
