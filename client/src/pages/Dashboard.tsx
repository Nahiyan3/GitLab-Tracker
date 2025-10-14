import { MetricCard } from "@/components/MetricCard";
import { ProjectCard } from "@/components/ProjectCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderGit2, Star, TrendingUp, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
    qualityScore: 42,
    lastActivity: "2 days ago",
    openIssues: 23,
    openMRs: 5,
    ciHealth: 65,
  },
  {
    id: "2",
    name: "old-frontend",
    group: "Frontend",
    qualityScore: 38,
    lastActivity: "5 hours ago",
    openIssues: 31,
    openMRs: 2,
    ciHealth: 48,
  },
  {
    id: "3",
    name: "data-pipeline",
    group: "Data",
    qualityScore: 55,
    lastActivity: "1 day ago",
    openIssues: 15,
    openMRs: 8,
    ciHealth: 72,
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
            <ProjectCard key={project.id} {...project} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
