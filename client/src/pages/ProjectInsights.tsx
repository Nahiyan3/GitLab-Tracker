import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

// Mock data for tracked projects with all 9 metrics
const trackedProjects = [
  {
    id: "1",
    name: "E-commerce Platform",
    group: "Backend",
    metrics: {
      codeReview: 4.2,
      technicalDebt: 3.8,
      testQuality: 4.5,
      documentation: 3.9,
      deployment: 4.1,
      dependencies: 3.7,
      teamMorale: 4.3,
      apiScore: 4.0,
      combinedScore: 4.1,
    },
  },
  {
    id: "2",
    name: "Mobile App Backend",
    group: "Backend",
    metrics: {
      codeReview: 3.5,
      technicalDebt: 3.2,
      testQuality: 3.8,
      documentation: 3.4,
      deployment: 3.9,
      dependencies: 3.3,
      teamMorale: 3.6,
      apiScore: 3.7,
      combinedScore: 3.6,
    },
  },
  {
    id: "3",
    name: "Analytics Dashboard",
    group: "Frontend",
    metrics: {
      codeReview: 4.5,
      technicalDebt: 4.2,
      testQuality: 4.0,
      documentation: 4.3,
      deployment: 4.4,
      dependencies: 4.1,
      teamMorale: 4.5,
      apiScore: 4.3,
      combinedScore: 4.3,
    },
  },
  {
    id: "4",
    name: "legacy-api",
    group: "Backend",
    metrics: {
      codeReview: 3.2,
      technicalDebt: 2.1,
      testQuality: 2.5,
      documentation: 2.8,
      deployment: 3.5,
      dependencies: 2.3,
      teamMorale: 3.1,
      apiScore: 3.0,
      combinedScore: 2.8,
    },
  },
  {
    id: "5",
    name: "Payment Gateway",
    group: "Backend",
    metrics: {
      codeReview: 4.8,
      technicalDebt: 4.5,
      testQuality: 4.9,
      documentation: 4.6,
      deployment: 4.7,
      dependencies: 4.4,
      teamMorale: 4.5,
      apiScore: 4.6,
      combinedScore: 4.7,
    },
  },
];

const ProjectInsights = () => {
  const getRadarData = (metrics: any) => [
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Project Insights</h1>
        <p className="text-muted-foreground">
          Quality metrics and analysis for all tracked projects
        </p>
      </div>

      {/* Projects List */}
      <div className="space-y-6">
        {trackedProjects.map((project) => (
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
                      <span className={`text-lg font-bold ${getScoreColor(project.metrics.codeReview)}`}>
                        {project.metrics.codeReview.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Technical Debt</span>
                      <span className={`text-lg font-bold ${getScoreColor(project.metrics.technicalDebt)}`}>
                        {project.metrics.technicalDebt.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Test Quality</span>
                      <span className={`text-lg font-bold ${getScoreColor(project.metrics.testQuality)}`}>
                        {project.metrics.testQuality.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Documentation</span>
                      <span className={`text-lg font-bold ${getScoreColor(project.metrics.documentation)}`}>
                        {project.metrics.documentation.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Deployment</span>
                      <span className={`text-lg font-bold ${getScoreColor(project.metrics.deployment)}`}>
                        {project.metrics.deployment.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Dependencies</span>
                      <span className={`text-lg font-bold ${getScoreColor(project.metrics.dependencies)}`}>
                        {project.metrics.dependencies.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">Team Morale</span>
                      <span className={`text-lg font-bold ${getScoreColor(project.metrics.teamMorale)}`}>
                        {project.metrics.teamMorale.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium">API Score</span>
                      <span className={`text-lg font-bold ${getScoreColor(project.metrics.apiScore)}`}>
                        {project.metrics.apiScore.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {/* Combined Score - Highlighted */}
                  <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                    <span className="text-base font-semibold">Combined Score</span>
                    <span className="text-2xl font-bold text-primary">
                      {project.metrics.combinedScore.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Spider Plot */}
                <div className="flex flex-col items-center justify-center">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">Metrics Visualization</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={getRadarData(project.metrics)}>
                      <PolarGrid />
                      <PolarAngleAxis 
                        dataKey="metric" 
                        tick={{ fontSize: 11 }}
                      />
                      <PolarRadiusAxis angle={90} domain={[0, 5]} />
                      <Radar 
                        name={project.name}
                        dataKey="score" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.6}
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
