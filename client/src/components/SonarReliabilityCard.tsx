import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle,
  Bug,
  Gauge,
  Clock,
  Shield
} from "lucide-react";

interface SonarReliabilityMetrics {
  bugs_total: number;
  bugs_critical: number;
  bugs_blocker: number;
  bugs_new: number;
  reliability_rating: string;
  reliability_remediation_effort: number;
  calculated_at: string;
}

interface SonarReliabilityCardProps {
  metrics: SonarReliabilityMetrics | null;
  loading: boolean;
}

export const SonarReliabilityCard = ({ metrics, loading }: SonarReliabilityCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SonarQube Reliability</CardTitle>
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
          <CardTitle className="text-lg">SonarQube Reliability</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No reliability metrics available. Click "Refresh Data" to fetch metrics.
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

  // Helper to format time (minutes to hours/days)
  const formatRemediationTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  // Helper to get priority bugs badge
  const getPriorityBadge = () => {
    const total = metrics.bugs_critical + metrics.bugs_blocker;
    if (total === 0) return <Badge variant="outline" className="bg-green-50">Healthy</Badge>;
    if (total <= 5) return <Badge variant="outline" className="bg-yellow-50">Warning</Badge>;
    return <Badge variant="destructive">Risk</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">SonarQube Reliability</CardTitle>
          <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Priority Bugs & Rating */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Priority Bugs</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">
                  {metrics.bugs_critical + metrics.bugs_blocker}
                </p>
                {getPriorityBadge()}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.bugs_critical} Critical, {metrics.bugs_blocker} Blocker
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getRatingColor(metrics.reliability_rating)} text-white text-xl px-3 py-1`}>
                  {metrics.reliability_rating}
                </Badge>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            {/* Bugs */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">Bugs</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Total Bugs</p>
                    <p className="text-xs text-muted-foreground">{metrics.bugs_total.toLocaleString()} bugs found</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">New Bugs</p>
                    <p className="text-xs text-muted-foreground">{metrics.bugs_new.toLocaleString()} in new code</p>
                  </div>
                </div>
                <Badge variant={metrics.bugs_new > 0 ? "destructive" : "outline"} />
              </div>
            </div>

            {/* Remediation Effort */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">Remediation</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Fix Time Estimate</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRemediationTime(metrics.reliability_remediation_effort)} estimated to fix all bugs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
