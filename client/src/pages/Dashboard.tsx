import { MetricCard } from "@/components/MetricCard";
import { ProjectCard } from "@/components/ProjectCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderGit2, Star, TrendingUp, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

const qualityDistribution = [
  { range: "0-50", count: 3, color: "hsl(var(--destructive))" },
  { range: "51-75", count: 8, color: "hsl(var(--warning))" },
  { range: "76-100", count: 12, color: "hsl(var(--success))" },
];

const trackingData = [
  { name: "Tracked", value: 23, color: "hsl(var(--primary))" },
  { name: "Untracked", value: 42, color: "hsl(var(--muted))" },
];

const needsAttention = [
  {
    id: "1",
    name: "legacy-api",
    group: "Backend",
    combinedScore: 2.8,
    metrics: [
      { metric: "Code Review", score: 3.2 },
      { metric: "Technical Debt", score: 2.1 },
      { metric: "Test Quality", score: 2.5 },
      { metric: "Documentation", score: 2.8 },
      { metric: "Deployment", score: 3.5 },
      { metric: "Dependencies", score: 2.3 },
      { metric: "Team Morale", score: 3.1 },
      { metric: "API Score", score: 3.0 },
      { metric: "Combined Score", score: 2.8 },
    ],
  },
  {
    id: "2",
    name: "old-frontend",
    group: "Frontend",
    combinedScore: 2.5,
    metrics: [
      { metric: "Code Review", score: 2.8 },
      { metric: "Technical Debt", score: 1.9 },
      { metric: "Test Quality", score: 2.2 },
      { metric: "Documentation", score: 2.6 },
      { metric: "Deployment", score: 3.0 },
      { metric: "Dependencies", score: 2.0 },
      { metric: "Team Morale", score: 2.8 },
      { metric: "API Score", score: 2.4 },
      { metric: "Combined Score", score: 2.5 },
    ],
  },
  {
    id: "3",
    name: "data-pipeline",
    group: "Data",
    combinedScore: 2.9,
    metrics: [
      { metric: "Code Review", score: 3.5 },
      { metric: "Technical Debt", score: 2.6 },
      { metric: "Test Quality", score: 2.8 },
      { metric: "Documentation", score: 2.5 },
      { metric: "Deployment", score: 3.2 },
      { metric: "Dependencies", score: 2.7 },
      { metric: "Team Morale", score: 3.3 },
      { metric: "API Score", score: 3.1 },
      { metric: "Combined Score", score: 2.9 },
    ],
  },
];

const Dashboard = () => {
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
          value={65}
          icon={FolderGit2}
          subtitle="Across all groups"
        />
        <MetricCard
          title="Tracked Projects"
          value={23}
          icon={Star}
          change={{ value: "+3 this week", positive: true }}
        />
        <MetricCard
          title="Average Quality"
          value="72/100"
          icon={TrendingUp}
          change={{ value: "+5 pts", positive: true }}
        />
        <MetricCard
          title="Needs Attention"
          value={5}
          icon={AlertTriangle}
          subtitle="Quality score < 50"
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {needsAttention.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{project.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{project.group}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Combined Score */}
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-primary">{project.combinedScore.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Combined Quality Score</div>
                </div>
                
                {/* Radar Chart */}
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={project.metrics}>
                    <PolarGrid />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fontSize: 10 }}
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} />
                    <Radar 
                      name={project.name}
                      dataKey="score" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
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
      </div>
    </div>
  );
};

export default Dashboard;
