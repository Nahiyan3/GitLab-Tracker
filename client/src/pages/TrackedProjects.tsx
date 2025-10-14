import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QualityBadge } from "@/components/QualityBadge";
import { RefreshCw, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";

interface TrackedProject {
  id: string;
  name: string;
  group: string;
  qualityScore: number;
  codeQuality: number;
  ciHealth: number;
  testCoverage: number;
  openIssues: number;
  openMRs: number;
  lastUpdated: string;
}

const mockTrackedProjects: TrackedProject[] = [
  {
    id: "1",
    name: "legacy-api",
    group: "Backend",
    qualityScore: 42,
    codeQuality: 45,
    ciHealth: 65,
    testCoverage: 38,
    openIssues: 23,
    openMRs: 5,
    lastUpdated: "2 hours ago",
  },
  {
    id: "2",
    name: "old-frontend",
    group: "Frontend",
    qualityScore: 38,
    codeQuality: 42,
    ciHealth: 48,
    testCoverage: 25,
    openIssues: 31,
    openMRs: 2,
    lastUpdated: "5 hours ago",
  },
  {
    id: "3",
    name: "data-pipeline",
    group: "Data",
    qualityScore: 55,
    codeQuality: 58,
    ciHealth: 72,
    testCoverage: 45,
    openIssues: 15,
    openMRs: 8,
    lastUpdated: "1 day ago",
  },
  {
    id: "4",
    name: "auth-service",
    group: "Backend",
    qualityScore: 78,
    codeQuality: 82,
    ciHealth: 85,
    testCoverage: 68,
    openIssues: 5,
    openMRs: 3,
    lastUpdated: "30 min ago",
  },
  {
    id: "5",
    name: "web-app",
    group: "Frontend",
    qualityScore: 85,
    codeQuality: 88,
    ciHealth: 92,
    testCoverage: 75,
    openIssues: 8,
    openMRs: 4,
    lastUpdated: "1 hour ago",
  },
  {
    id: "6",
    name: "api-gateway",
    group: "Backend",
    qualityScore: 92,
    codeQuality: 95,
    ciHealth: 98,
    testCoverage: 83,
    openIssues: 2,
    openMRs: 1,
    lastUpdated: "15 min ago",
  },
];

const TrackedProjects = () => {
  const [projects] = useState(mockTrackedProjects);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const sortedProjects = [...projects].sort((a, b) => 
    sortOrder === "asc" 
      ? a.qualityScore - b.qualityScore 
      : b.qualityScore - a.qualityScore
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tracked Projects</h1>
          <p className="text-muted-foreground">
            {projects.length} projects sorted by quality score
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
            Sort: {sortOrder === "asc" ? "Low → High" : "High → Low"}
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Column-based Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b sticky top-0">
              <tr>
                <th className="text-left p-3 font-semibold text-sm min-w-[200px]">Project</th>
                <th className="text-left p-3 font-semibold text-sm min-w-[120px]">Quality Score</th>
                <th className="text-left p-3 font-semibold text-sm min-w-[100px]">Code Quality</th>
                <th className="text-left p-3 font-semibold text-sm min-w-[100px]">CI Health</th>
                <th className="text-left p-3 font-semibold text-sm min-w-[100px]">Test Coverage</th>
                <th className="text-left p-3 font-semibold text-sm min-w-[80px]">Issues</th>
                <th className="text-left p-3 font-semibold text-sm min-w-[80px]">MRs</th>
                <th className="text-left p-3 font-semibold text-sm min-w-[120px]">Last Updated</th>
                <th className="text-right p-3 font-semibold text-sm min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedProjects.map((project) => (
                <tr 
                  key={project.id} 
                  className="border-b hover:bg-muted/50 transition-colors"
                >
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-xs text-muted-foreground">{project.group}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    <QualityBadge score={project.qualityScore} size="sm" />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            project.codeQuality >= 76 ? 'bg-success' : 
                            project.codeQuality >= 51 ? 'bg-warning' : 'bg-destructive'
                          }`}
                          style={{ width: `${project.codeQuality}%` }}
                        />
                      </div>
                      <span className="text-sm">{project.codeQuality}%</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            project.ciHealth >= 76 ? 'bg-success' : 
                            project.ciHealth >= 51 ? 'bg-warning' : 'bg-destructive'
                          }`}
                          style={{ width: `${project.ciHealth}%` }}
                        />
                      </div>
                      <span className="text-sm">{project.ciHealth}%</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            project.testCoverage >= 76 ? 'bg-success' : 
                            project.testCoverage >= 51 ? 'bg-warning' : 'bg-destructive'
                          }`}
                          style={{ width: `${project.testCoverage}%` }}
                        />
                      </div>
                      <span className="text-sm">{project.testCoverage}%</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge 
                      variant={project.openIssues > 20 ? "destructive" : "outline"}
                      className="text-xs"
                    >
                      {project.openIssues}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-xs">
                      {project.openMRs}
                    </Badge>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {project.lastUpdated}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/project/${project.id}`}>View</Link>
                      </Button>
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TrackedProjects;
