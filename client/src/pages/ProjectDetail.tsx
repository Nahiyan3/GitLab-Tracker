import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { QualityBadge } from "@/components/QualityBadge";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, 
  RefreshCw, 
  Activity, 
  GitMerge, 
  AlertCircle, 
  CheckCircle2,
  TrendingUp,
  ArrowLeft
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const metricTrends = [
  { date: "Jan", score: 65, coverage: 55, ciHealth: 70 },
  { date: "Feb", score: 68, coverage: 58, ciHealth: 72 },
  { date: "Mar", score: 72, coverage: 62, ciHealth: 78 },
  { date: "Apr", score: 75, coverage: 68, ciHealth: 82 },
  { date: "May", score: 78, coverage: 72, ciHealth: 85 },
];

const scoreBreakdown = [
  { category: "Code Quality", score: 82 },
  { category: "CI Health", score: 85 },
  { category: "Test Coverage", score: 68 },
  { category: "Security", score: 90 },
  { category: "Documentation", score: 65 },
];

const ProjectDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock project data
  const project = {
    id,
    name: "auth-service",
    group: "Backend",
    qualityScore: 78,
    codeQuality: 82,
    ciHealth: 85,
    testCoverage: 68,
    openIssues: 5,
    openMRs: 3,
    lastUpdated: "30 min ago",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/tracked">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-1">{project.name}</h1>
            <p className="text-muted-foreground">{project.group}</p>
          </div>
          <QualityBadge score={project.qualityScore} size="lg" />
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link to={`/project/${id}/insights`}>
              AI Project Insights
            </Link>
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button size="sm" variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in GitLab
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
          <TabsTrigger value="ai-report">AI Report</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Code Quality</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.codeQuality}%</div>
                <p className="text-xs text-success">+5% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CI Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.ciHealth}%</div>
                <p className="text-xs text-success">+3% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.openIssues}</div>
                <p className="text-xs text-destructive">+2 this week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open MRs</CardTitle>
                <GitMerge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.openMRs}</div>
                <p className="text-xs text-muted-foreground">Unchanged</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Last Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{project.lastUpdated}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Score Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metricTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} name="Quality Score" />
                  <Line type="monotone" dataKey="coverage" stroke="hsl(var(--success))" strokeWidth={2} name="Coverage" />
                  <Line type="monotone" dataKey="ciHealth" stroke="hsl(var(--warning))" strokeWidth={2} name="CI Health" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="category" type="category" />
                  <Tooltip />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="snapshots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historical Snapshots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metricTrends.reverse().map((snapshot, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{snapshot.date} 2024</p>
                      <p className="text-sm text-muted-foreground">Quality Score: {snapshot.score}/100</p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Coverage: </span>
                        <span className="font-medium">{snapshot.coverage}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">CI: </span>
                        <span className="font-medium">{snapshot.ciHealth}%</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-report" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button>
              <RefreshCw className="h-4 w-4 mr-2" />
              Re-run AI Analysis
            </Button>
          </div>

          <Card className="border-success">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <CardTitle className="text-success">What's Going Well</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Strong CI/CD pipeline with 85% health score</li>
                <li>• Code quality metrics consistently above 80%</li>
                <li>• Active maintenance with regular updates</li>
                <li>• Security scanning enabled and up to date</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-warning">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                <CardTitle className="text-warning">Issues Detected</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Test coverage at 68% - below target of 80%</li>
                <li>• Documentation completeness at 65%</li>
                <li>• 5 open issues pending resolution</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-primary">Recommendations</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Prioritize writing tests for uncovered modules</li>
                <li>• Update API documentation to match current endpoints</li>
                <li>• Review and close stale issues</li>
                <li>• Consider adding integration tests for critical paths</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetail;
