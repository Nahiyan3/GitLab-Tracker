import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield,
  ShieldAlert,
  AlertTriangle,
  Gauge,
  Clock,
  Eye,
  CheckCircle2
} from "lucide-react";

interface SonarSecurityMetrics {
  vulnerabilities_total: number;
  vulnerabilities_new: number;
  security_rating: string;
  security_hotspots_total: number;
  security_hotspots_reviewed: number;
  security_review_rating: string;
  security_remediation_effort: number;
  calculated_at: string;
}

interface SonarSecurityCardProps {
  metrics: SonarSecurityMetrics | null;
  loading: boolean;
}

export const SonarSecurityCard = ({ metrics, loading }: SonarSecurityCardProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SonarQube Security</CardTitle>
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
          <CardTitle className="text-lg">SonarQube Security</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No security metrics available. Click "Refresh Data" to fetch metrics.
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

  // Helper to get vulnerability badge
  const getVulnerabilityBadge = () => {
    if (metrics.vulnerabilities_total === 0) return <Badge variant="outline" className="bg-green-50">Secure</Badge>;
    if (metrics.vulnerabilities_total <= 5) return <Badge variant="outline" className="bg-yellow-50">Warning</Badge>;
    return <Badge variant="destructive">Critical</Badge>;
  };

  // Helper to get hotspot review status badge
  const getHotspotReviewBadge = () => {
    const reviewPercentage = Number(metrics.security_hotspots_reviewed || 0);
    if (reviewPercentage >= 80) return <Badge variant="outline" className="bg-green-50">Good</Badge>;
    if (reviewPercentage >= 50) return <Badge variant="outline" className="bg-yellow-50">Fair</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">SonarQube Security</CardTitle>
          <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Vulnerabilities & Rating */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Vulnerabilities</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">
                  {metrics.vulnerabilities_total}
                </p>
                {getVulnerabilityBadge()}
              </div>
              {metrics.vulnerabilities_new > 0 && (
                <p className="text-xs text-muted-foreground text-red-500">
                  +{metrics.vulnerabilities_new} in new code
                </p>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Security Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getRatingColor(metrics.security_rating)} text-white text-xl px-3 py-1`}>
                  {metrics.security_rating}
                </Badge>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            {/* Security Hotspots */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">Security Hotspots</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Total Hotspots</p>
                    <p className="text-xs text-muted-foreground">{metrics.security_hotspots_total.toLocaleString()} hotspots found</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Hotspots Reviewed</p>
                    <p className="text-xs text-muted-foreground">
                      {Number(metrics.security_hotspots_reviewed || 0).toFixed(1)}% reviewed
                    </p>
                  </div>
                </div>
                {getHotspotReviewBadge()}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Security Review Rating</p>
                    <p className="text-xs text-muted-foreground">Overall review quality</p>
                  </div>
                </div>
                <Badge className={`${getRatingColor(metrics.security_review_rating)} text-white`}>
                  {metrics.security_review_rating}
                </Badge>
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
                      {formatRemediationTime(metrics.security_remediation_effort)} to fix vulnerabilities
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
