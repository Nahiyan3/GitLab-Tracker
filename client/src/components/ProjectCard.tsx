import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QualityBadge } from "./QualityBadge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Activity, AlertCircle, GitMerge } from "lucide-react";
import { Link } from "react-router-dom";

export interface ProjectCardProps {
  id: string;
  name: string;
  group: string;
  qualityScore: number;
  lastActivity: string;
  openIssues: number;
  openMRs: number;
  ciHealth: number;
}

export const ProjectCard = ({
  id,
  name,
  group,
  qualityScore,
  lastActivity,
  openIssues,
  openMRs,
  ciHealth,
}: ProjectCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{name}</CardTitle>
            <p className="text-sm text-muted-foreground">{group}</p>
          </div>
          <QualityBadge score={qualityScore} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span>{openIssues} issues</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <GitMerge className="h-4 w-4 text-muted-foreground" />
            <span>{openMRs} MRs</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span>{ciHealth}% CI</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {lastActivity}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link to={`/project/${id}`}>View Details</Link>
          </Button>
          <Button size="sm" variant="ghost">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
