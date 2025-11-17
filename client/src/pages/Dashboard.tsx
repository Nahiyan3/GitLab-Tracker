import { useState, useEffect } from "react";
import { MetricCard } from "@/components/MetricCard";
import { ProjectCard } from "@/components/ProjectCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderGit2, Star, TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface DashboardStats {
  totalProjects: number;
  trackedProjects: number;
  averageQuality: number;
  needsAttention: number;
  qualityDistribution: {
    critical: number;
    warning: number;
    good: number;
    excellent: number;
  };
  projectsNeedingAttention: Array<{
    id: number;
    uuid: string;
    name: string;
    full_path: string;
    combined_score: number;
    insights_data: any;
  }>;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects/dashboard-stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricsFromInsights = (insightsData: any) => {
    const sectionScores: any = {};
    if (insightsData?.section_scores && Array.isArray(insightsData.section_scores)) {
      insightsData.section_scores.forEach((section: any) => {
        const sectionName = section.name.toLowerCase().replace(/\s+/g, '');
        sectionScores[sectionName] = section.score || 0;
      });
    }

    return [
      { metric: "Code Review", score: sectionScores.codereview || 0 },
      { metric: "Technical Debt", score: sectionScores.technicaldebt || 0 },
      { metric: "Test Quality", score: sectionScores.testquality || 0 },
      { metric: "Documentation", score: sectionScores.documentation || 0 },
      { metric: "Deployment", score: sectionScores.deployment || 0 },
      { metric: "Dependencies", score: sectionScores.dependencies || 0 },
      { metric: "Team Morale", score: sectionScores.teammorale || sectionScores.teamvelocity || sectionScores.teamvelocitymorale || 0 },
      { metric: "API Score", score: insightsData?.api_scores?.api_score || 0 },
      { metric: "Combined Score", score: parseFloat(insightsData?.combined_score || 0) },
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    );
  }

  const qualityDistribution = [
    { range: "0-2 (Critical)", count: stats.qualityDistribution.critical, color: "hsl(var(--destructive))" },
    { range: "2-3 (Warning)", count: stats.qualityDistribution.warning, color: "hsl(var(--warning))" },
    { range: "3-4 (Good)", count: stats.qualityDistribution.good, color: "hsl(var(--chart-2))" },
    { range: "4-5 (Excellent)", count: stats.qualityDistribution.excellent, color: "hsl(var(--success))" },
  ];

  const trackingData = [
    { name: "Tracked", value: stats.trackedProjects, color: "hsl(var(--primary))" },
    { name: "Untracked", value: stats.totalProjects - stats.trackedProjects, color: "hsl(var(--muted))" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Monitor all GitLab projects and track quality metrics
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={FolderGit2}
          subtitle="Across all groups"
        />
        <MetricCard
          title="Tracked Projects"
          value={stats.trackedProjects}
          icon={Star}
        />
        <MetricCard
          title="Average Quality"
          value={`${stats.averageQuality.toFixed(2)}/5`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Needs Attention"
          value={stats.needsAttention}
          icon={AlertTriangle}
          subtitle="Combined score < 3"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quality Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={qualityDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tracking Status</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={trackingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {trackingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Projects Needing Attention */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Projects Needing Attention</h2>
          <Link to="/tracked" className="text-sm text-primary hover:underline">
            View all tracked →
          </Link>
        </div>
        {stats.projectsNeedingAttention.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No projects need attention right now! 🎉</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.projectsNeedingAttention.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{project.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{project.full_path?.split('/')[0] || 'Unknown'}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Combined Score */}
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-destructive">{Number(project.combined_score).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Combined Quality Score</div>
                  </div>
                  
                  {/* Radar Chart */}
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={getMetricsFromInsights(project.insights_data)}>
                      <PolarGrid />
                      <PolarAngleAxis 
                        dataKey="metric" 
                        tick={{ fontSize: 10 }}
                      />
                      <PolarRadiusAxis angle={90} domain={[0, 5]} />
                      <Radar 
                        name={project.name}
                        dataKey="score" 
                        stroke="hsl(var(--destructive))" 
                        fill="hsl(var(--destructive))" 
                        fillOpacity={0.5}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>

                  {/* View Details Button */}
                  <Button asChild size="sm" variant="outline" className="w-full mt-4">
                    <Link to={`/project/${project.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
