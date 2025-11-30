import { useState, useEffect } from "react";
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
import { api } from "@/lib/api";
import { IssueMetricsCard } from "@/components/IssueMetricsCard";
import { MRMetricsCard } from "@/components/MRMetricsCard";

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
  const [insightsHistory, setInsightsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [issueMetrics, setIssueMetrics] = useState<any>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [mrMetrics, setMrMetrics] = useState<any>(null);
  const [mrMetricsLoading, setMrMetricsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // Fetch insights history
  useEffect(() => {
    const fetchInsightsHistory = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await api.get(`/ai/project-insights-history/${id}`);
        
        if (response.history && response.history.length > 0) {
          setInsightsHistory(response.history);
          
          // Transform data for chart
          const transformedData = response.history.map((insight: any) => {
            const date = new Date(insight.created_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            });
            
            const sections = insight.insights_data?.section_scores || [];
            const chartPoint: any = { date };
            
            console.log('Section names in data:', sections.map((s: any) => s.name));
            
            // Add each section score
            sections.forEach((section: any) => {
              // Normalize Team Velocity & Morale to just Team Morale for chart
              if (section.name.toLowerCase().includes('morale') || section.name.toLowerCase().includes('velocity')) {
                chartPoint['Team Morale'] = section.score;
              } else {
                chartPoint[section.name] = section.score;
              }
            });
            
            // Add API and Combined scores
            chartPoint['API Score'] = insight.api_score;
            chartPoint['Combined Score'] = insight.combined_score;
            
            console.log('Chart point:', chartPoint);
            
            return chartPoint;
          });
          
          setChartData(transformedData);
        }
      } catch (error) {
        console.error('Failed to fetch insights history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsightsHistory();
  }, [id]);

  // Fetch issue metrics
  useEffect(() => {
    const fetchIssueMetrics = async () => {
      if (!id) return;
      
      try {
        setMetricsLoading(true);
        const response = await api.get(`/projects/${id}/issue-metrics`);
        
        if (response.success) {
          setIssueMetrics(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch issue metrics:', error);
      } finally {
        setMetricsLoading(false);
      }
    };

    fetchIssueMetrics();
  }, [id]);

  // Fetch MR metrics
  useEffect(() => {
    const fetchMRMetrics = async () => {
      if (!id) return;
      
      try {
        setMrMetricsLoading(true);
        const response = await api.get(`/projects/${id}/mr-metrics`);
        
        if (response.success) {
          setMrMetrics(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch MR metrics:', error);
      } finally {
        setMrMetricsLoading(false);
      }
    };

    fetchMRMetrics();
  }, [id]);

  // Handle refresh button click
  const handleRefreshData = async () => {
    if (!id) return;
    
    try {
      setRefreshing(true);
      
      // Refresh both issue and MR metrics in parallel
      const [issueResponse, mrResponse] = await Promise.all([
        api.post(`/projects/${id}/issue-metrics/refresh`, {}),
        api.post(`/projects/${id}/mr-metrics/refresh`, {})
      ]);
      
      if (issueResponse.success) {
        setIssueMetrics(issueResponse.data);
        console.log('Issue metrics refreshed successfully');
      }
      
      if (mrResponse.success) {
        setMrMetrics(mrResponse.data);
        console.log('MR metrics refreshed successfully');
      }
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
      // Show error message (you can add a toast here)
    } finally {
      setRefreshing(false);
    }
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
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

          {/* Issue Health Metrics Card */}
          <IssueMetricsCard metrics={issueMetrics} loading={metricsLoading} />

          {/* MR Health Metrics Card */}
          <MRMetricsCard metrics={mrMetrics} loading={mrMetricsLoading} />

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
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                  <Activity className="h-12 w-12 mb-4 opacity-50" />
                  <p>No insights history available</p>
                  <p className="text-sm">Generate insights to see trends</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    
                    {/* 7 Section Scores */}
                    <Line 
                      type="monotone" 
                      dataKey="Code Review" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Technical Debt" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Test Quality" 
                      stroke="#ffc658" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Documentation" 
                      stroke="#ff7c7c" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Deployment" 
                      stroke="#a28bd4" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Dependencies" 
                      stroke="#ff9f43" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Team Morale" 
                      stroke="#54a0ff" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    
                    {/* API Score */}
                    <Line 
                      type="monotone" 
                      dataKey="API Score" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ r: 5 }}
                    />
                    
                    {/* Combined Score */}
                    <Line 
                      type="monotone" 
                      dataKey="Combined Score" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
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
