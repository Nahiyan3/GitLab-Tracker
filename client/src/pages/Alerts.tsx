import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, XCircle, TrendingDown, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface Alert {
  id: string;
  projectId: string;
  projectName: string;
  type: "quality-drop" | "ci-failure" | "issues-increase" | "security";
  severity: "high" | "medium" | "low";
  message: string;
  timestamp: string;
  resolved: boolean;
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    projectId: "1",
    projectName: "legacy-api",
    type: "quality-drop",
    severity: "high",
    message: "Quality score dropped from 58 to 42 (-16 points)",
    timestamp: "2 hours ago",
    resolved: false,
  },
  {
    id: "2",
    projectId: "2",
    projectName: "old-frontend",
    type: "ci-failure",
    severity: "high",
    message: "CI pipeline failed 3 times in the last 24 hours",
    timestamp: "5 hours ago",
    resolved: false,
  },
  {
    id: "3",
    projectId: "3",
    projectName: "data-pipeline",
    type: "issues-increase",
    severity: "medium",
    message: "Open issues increased by 40% this week",
    timestamp: "1 day ago",
    resolved: false,
  },
  {
    id: "4",
    projectId: "4",
    projectName: "auth-service",
    type: "security",
    severity: "medium",
    message: "2 new security vulnerabilities detected",
    timestamp: "2 days ago",
    resolved: true,
  },
  {
    id: "5",
    projectId: "5",
    projectName: "web-app",
    type: "quality-drop",
    severity: "low",
    message: "Test coverage decreased to 72% (-3%)",
    timestamp: "3 days ago",
    resolved: true,
  },
];

const Alerts = () => {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [showResolved, setShowResolved] = useState(false);

  const filteredAlerts = alerts.filter(alert => {
    const matchesType = typeFilter === "all" || alert.type === typeFilter;
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesResolved = showResolved || !alert.resolved;
    return matchesType && matchesSeverity && matchesResolved;
  });

  const markResolved = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, resolved: true } : a));
    toast({
      title: "Alert resolved",
      description: "Alert marked as resolved",
    });
  };

  const getIcon = (type: Alert["type"]) => {
    switch (type) {
      case "quality-drop":
        return <TrendingDown className="h-5 w-5" />;
      case "ci-failure":
        return <XCircle className="h-5 w-5" />;
      case "issues-increase":
        return <AlertTriangle className="h-5 w-5" />;
      case "security":
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getSeverityBadge = (severity: Alert["severity"]) => {
    switch (severity) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
      case "medium":
        return <Badge variant="warning">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const getTypeLabel = (type: Alert["type"]) => {
    switch (type) {
      case "quality-drop":
        return "Quality Drop";
      case "ci-failure":
        return "CI Failure";
      case "issues-increase":
        return "Issues Increase";
      case "security":
        return "Security";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Alerts & Notifications</h1>
        <p className="text-muted-foreground">
          Monitor important events across tracked projects
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="quality-drop">Quality Drop</SelectItem>
              <SelectItem value="ci-failure">CI Failure</SelectItem>
              <SelectItem value="issues-increase">Issues Increase</SelectItem>
              <SelectItem value="security">Security</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={showResolved ? "default" : "outline"}
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? "Hide" : "Show"} Resolved
          </Button>
        </div>
      </Card>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No alerts to show</h3>
            <p className="text-sm text-muted-foreground">
              All systems are running smoothly
            </p>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card key={alert.id} className={alert.resolved ? "opacity-60" : ""}>
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 ${
                    alert.severity === "high" ? "text-destructive" :
                    alert.severity === "medium" ? "text-warning" : "text-muted-foreground"
                  }`}>
                    {getIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{alert.projectName}</h3>
                          {getSeverityBadge(alert.severity)}
                          <Badge variant="outline">{getTypeLabel(alert.type)}</Badge>
                          {alert.resolved && (
                            <Badge variant="success">Resolved</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.timestamp}</p>
                      </div>
                    </div>
                    <p className="text-sm mb-3">{alert.message}</p>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/project/${alert.projectId}`}>
                          View Project
                        </Link>
                      </Button>
                      {!alert.resolved && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => markResolved(alert.id)}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;
