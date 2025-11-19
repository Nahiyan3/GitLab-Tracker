import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { Loader2, AlertCircle } from 'lucide-react';

interface ProjectMetrics {
  codeReview: number;
  technicalDebt: number;
  testQuality: number;
  documentation: number;
  deployment: number;
  dependencies: number;
  teamMorale: number;
  apiScore: number;
  combinedScore: number;
}

interface ProjectInsight {
  id: number;
  uuid: string;
  name: string;
  group: string;
  metrics: ProjectMetrics;
  created_at: string;
}

const ProjectInsights = () => {
  const [projects, setProjects] = useState<ProjectInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllProjectInsights();
  }, []);

  const fetchAllProjectInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/ai/all-project-insights');
      
      if (!response.ok) {
        throw new Error('Failed to fetch project insights');
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err: any) {
      console.error('Error fetching project insights:', err);
      setError(err.message || 'Failed to load project insights');
    } finally {
      setLoading(false);
    }
  };

  const getRadarData = (metrics: ProjectMetrics) => [
    { metric: "Code Review", score: metrics.codeReview },
    { metric: "Technical Debt", score: metrics.technicalDebt },
    { metric: "Test Quality", score: metrics.testQuality },
    { metric: "Documentation", score: metrics.documentation },
    { metric: "Deployment", score: metrics.deployment },
    { metric: "Dependencies", score: metrics.dependencies },
    { metric: "Team Morale", score: metrics.teamMorale },
    { metric: "API Score", score: metrics.apiScore },
    { metric: "Combined Score", score: metrics.combinedScore },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 4) return "text-green-600 dark:text-green-400";
    if (score >= 3) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const formatScore = (score: number | undefined | null): string => {
    if (score === undefined || score === null || isNaN(score)) {
      return "0.00";
    }
    return Number(score).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading project insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-destructive font-semibold mb-2">Error loading insights</p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <Button onClick={fetchAllProjectInsights} variant="outline" className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground font-semibold mb-2">No insights available</p>
          <p className="text-sm text-muted-foreground">Generate insights for your projects to see them here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Project Insights</h1>
          <p className="text-muted-foreground">
            Quality metrics and analysis for {projects.length} tracked project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={fetchAllProjectInsights} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Projects List */}
      <div className="space-y-6">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{project.group}</p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/project/${project.id}`}>View Details</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Metrics List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-4">Quality Metrics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Code Review</span>
                      <span className={`text-lg font-bold ${getScoreColor(project.metrics.codeReview || 0)}`}>
                        {formatScore(project.metrics.codeReview)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Technical Debt</span>
                      <span className={`text-lg font-bold ${getScoreColor(project.metrics.technicalDebt || 0)}`}>
                        {formatScore(project.metrics.technicalDebt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Test Quality</span>
                      <span className={`text-lg font-bold ${getScoreColor(project.metrics.testQuality || 0)}`}>
                        {formatScore(project.metrics.testQuality)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Documentation</span>
                      <span className={`text-lg font-bold ${getScoreColor(project.metrics.documentation || 0)}`}>
                        {formatScore(project.metrics.documentation)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Deployment</span>
                      <span className={`text-lg font-bold ${getScoreColor(project.metrics.deployment || 0)}`}>
                        {formatScore(project.metrics.deployment)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Dependencies</span>
                      <span className={`text-lg font-bold ${getScoreColor(project.metrics.dependencies || 0)}`}>
                        {formatScore(project.metrics.dependencies)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Team Morale</span>
                      <span className={`text-lg font-bold ${getScoreColor(project.metrics.teamMorale || 0)}`}>
                        {formatScore(project.metrics.teamMorale)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">API Score</span>
                      <span className={`text-lg font-bold ${getScoreColor(project.metrics.apiScore || 0)}`}>
                        {formatScore(project.metrics.apiScore)}
                      </span>
                    </div>
                  </div>
                  {/* Combined Score - Highlighted */}
                  <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                    <span className="text-base font-semibold">Combined Score</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatScore(project.metrics.combinedScore)}
                    </span>
                  </div>
                </div>

                {/* Spider Plot */}
                <div className="flex flex-col items-center justify-center">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">Metrics Visualization</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={getRadarData(project.metrics)} cx={150} cy={150}>
                      <defs>
                        <radialGradient id={`radarGradient-${project.id}`} cx="150" cy="150" r="100" fx="150" fy="150" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#ff1a1a" stopOpacity={0.95} />
                          <stop offset="25%" stopColor="#ff6b6b" stopOpacity={0.85} />
                          <stop offset="50%" stopColor="#ffd700" stopOpacity={0.8} />
                          <stop offset="75%" stopColor="#7cfc00" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity={0.9} />
                        </radialGradient>
                      </defs>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis 
                        dataKey="metric" 
                        tick={{ fontSize: 11 }}
                      />
                      <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} />
                      <Radar 
                        name={project.name}
                        dataKey="score" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fill={`url(#radarGradient-${project.id})`}
                        fillOpacity={0.7}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProjectInsights;
