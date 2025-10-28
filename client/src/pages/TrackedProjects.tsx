import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QualityBadge } from "@/components/QualityBadge";
import { RefreshCw, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";

interface TrackedProject {
  id: number;
  name: string;
  description?: string;
  web_url: string;
  lastActivityAt: string;
  visibility: string;
  membersCount: number;
  fullPath: string;
  groupPath?: string;
  openIssues: number;
  openMrs: number;
  openMilestonesCount: number;
  tracked: boolean;
  syncedAt: string;
  snapshotDate?: string;
  // SonarCloud metrics
  sonarSecurityHigh?: number;
  sonarSecurityBlocker?: number;
  sonarReliabilityHigh?: number;
  sonarReliabilityBlocker?: number;
  sonarMaintainabilityHigh?: number;
  sonarMaintainabilityBlocker?: number;
}

const AUTO_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Calculate dummy quality metrics based on real data (COMMENTED OUT FOR FUTURE USE)
// const calculateQualityMetrics = (project: TrackedProject) => {
//   // Base quality score on issues and MRs (inverse relationship with issues)
//   const issueScore = Math.max(0, 100 - (project.total_issues * 2));
//   const mrScore = Math.min(100, 50 + (project.total_mrs * 5));
//   const qualityScore = Math.round((issueScore * 0.6 + mrScore * 0.4));
//   
//   // Generate dummy but consistent metrics (could be replaced with real data later)
//   const codeQuality = Math.min(100, qualityScore + Math.floor(Math.random() * 20) - 10);
//   const ciHealth = Math.min(100, qualityScore + Math.floor(Math.random() * 15));
//   const testCoverage = Math.max(0, Math.min(100, qualityScore - Math.floor(Math.random() * 25)));
//   
//   return {
//     qualityScore,
//     codeQuality,
//     ciHealth,
//     testCoverage
//   };
// };

const TrackedProjects = () => {
  const [projects, setProjects] = useState<TrackedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingProjectId, setSyncingProjectId] = useState<number | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  // Use ref to prevent duplicate auto-refresh calls
  const isRefreshingRef = useRef(false);

  // Fetch tracked projects from database
  const fetchTrackedProjects = useCallback(async () => {
    try {
      setLoading(true);
      const trackedProjects = await api.get('/tracking');
      
      // Map API response to TrackedProject interface
      const enhancedProjects = trackedProjects.map((project: any) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        web_url: project.web_url,
        lastActivityAt: project.lastActivityAt,
        visibility: project.visibility,
        membersCount: project.membersCount || 0,
        fullPath: project.fullPath,
        groupPath: project.groupPath,
        openIssues: project.openIssues || 0,
        openMrs: project.openMrs || 0,
        openMilestonesCount: project.openMilestonesCount || 0,
        tracked: project.tracked,
        syncedAt: project.syncedAt,
        snapshotDate: project.snapshotDate,
        // SonarCloud metrics
        sonarSecurityHigh: project.sonarSecurityHigh || 0,
        sonarSecurityBlocker: project.sonarSecurityBlocker || 0,
        sonarReliabilityHigh: project.sonarReliabilityHigh || 0,
        sonarReliabilityBlocker: project.sonarReliabilityBlocker || 0,
        sonarMaintainabilityHigh: project.sonarMaintainabilityHigh || 0,
        sonarMaintainabilityBlocker: project.sonarMaintainabilityBlocker || 0,
      }));
      
      setProjects(enhancedProjects);
      toast({
        title: "Tracked projects loaded",
        description: `Successfully loaded ${enhancedProjects.length} tracked projects`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tracked projects from database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh all tracked projects (create new snapshots)
  const syncAllProjects = async () => {
    // Prevent duplicate calls (especially from auto-refresh)
    if (isRefreshingRef.current) {
      console.log('⚠️ Refresh already in progress, skipping duplicate call');
      return;
    }
    
    try {
      isRefreshingRef.current = true;
      setSyncing(true);
      toast({
        title: "Refreshing...",
        description: "Creating new snapshots for all tracked projects",
      });

      await api.post('/tracking/refresh-all', {});
      
      // Reload tracked projects to get new snapshots
      await fetchTrackedProjects();
      
      setLastSyncTime(new Date());
      toast({
        title: "Refresh completed",
        description: `Successfully refreshed tracked projects`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh projects",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
      isRefreshingRef.current = false;
    }
  };

  // Refresh single project (create new snapshot)
  const syncSingleProject = async (projectId: number) => {
    try {
      setSyncingProjectId(projectId);
      toast({
        title: "Refreshing project...",
        description: "Creating new snapshot from GitLab",
      });

      await api.post(`/tracking/refresh/${projectId}`, {});
      
      // Reload to get the new snapshot
      await fetchTrackedProjects();
      
      toast({
        title: "Refresh completed",
        description: "Project snapshot updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh project",
        variant: "destructive",
      });
    } finally {
      setSyncingProjectId(null);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTrackedProjects();
  }, [fetchTrackedProjects]);

  // Auto-refresh timer
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!syncing && !syncingProjectId) {
        console.log('Auto-refreshing tracked projects...');
        syncAllProjects();
      }
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, []); // Empty deps - interval created only once on mount

  const formatDate = (dateString: string) => {
    if (!dateString) return "Never";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Invalid date";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tracked projects from database...</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-2">No Tracked Projects</h2>
          <p className="text-muted-foreground mb-6">
            You haven't tracked any projects yet. Go to All Projects page to start tracking.
          </p>
          <Button onClick={() => window.location.href = '/all-projects'}>
            Go to All Projects
          </Button>
        </Card>
      </div>
    );
  }

  const sortedProjects = [...projects].sort((a, b) => 
    sortOrder === "asc" 
      ? (a.openIssues || 0) - (b.openIssues || 0)
      : (b.openIssues || 0) - (a.openIssues || 0)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tracked Projects</h1>
          <p className="text-muted-foreground">
            {projects.length} projects sorted by open issues
            {lastSyncTime && ` • Last synced: ${formatDate(lastSyncTime.toISOString())}`}
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={syncAllProjects}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Refresh All'}
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
                {/* <th className="text-left p-3 font-semibold text-sm min-w-[120px]">Quality Score</th> */}
                {/* <th className="text-left p-3 font-semibold text-sm min-w-[100px]">Code Quality</th> */}
                {/* <th className="text-left p-3 font-semibold text-sm min-w-[100px]">CI Health</th> */}
                <th className="text-left p-3 font-semibold text-sm min-w-[100px]">Security High</th>
                <th className="text-left p-3 font-semibold text-sm min-w-[120px]">Security Blocker</th>
                <th className="text-left p-3 font-semibold text-sm min-w-[120px]">Reliability High</th>
                <th className="text-left p-3 font-semibold text-sm min-w-[140px]">Reliability Blocker</th>
                <th className="text-left p-3 font-semibold text-sm min-w-[150px]">Maintainability High</th>
                <th className="text-left p-3 font-semibold text-sm min-w-[160px]">Maintainability Blocker</th>
                <th className="text-left p-3 font-semibold text-sm min-w-[80px]">Issues</th>
                <th className="text-left p-3 font-semibold text-sm min-w-[80px]">Open MRs</th>
                <th className="text-left p-3 font-semibold text-sm min-w-[120px]">Open Milestones</th>
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
                      <div className="text-xs text-muted-foreground">
                        {project.groupPath || project.fullPath || 'No group'}
                      </div>
                    </div>
                  </td>
                  {/* <td className="p-3">
                    <QualityBadge score={project.qualityScore || 0} size="sm" />
                  </td> */}
                  {/* <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            (project.codeQuality || 0) >= 76 ? 'bg-success' : 
                            (project.codeQuality || 0) >= 51 ? 'bg-warning' : 'bg-destructive'
                          }`}
                          style={{ width: `${project.codeQuality || 0}%` }}
                        />
                      </div>
                      <span className="text-sm">{project.codeQuality || 0}%</span>
                    </div>
                  </td> */}
                  {/* <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            (project.ciHealth || 0) >= 76 ? 'bg-success' : 
                            (project.ciHealth || 0) >= 51 ? 'bg-warning' : 'bg-destructive'
                          }`}
                          style={{ width: `${project.ciHealth || 0}%` }}
                        />
                      </div>
                      <span className="text-sm">{project.ciHealth || 0}%</span>
                    </div>
                  </td> */}
                  <td className="p-3">
                    <span className="text-sm">{project.sonarSecurityHigh || 0}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-sm">{project.sonarSecurityBlocker || 0}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-sm">{project.sonarReliabilityHigh || 0}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-sm">{project.sonarReliabilityBlocker || 0}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-sm">{project.sonarMaintainabilityHigh || 0}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-sm">{project.sonarMaintainabilityBlocker || 0}</span>
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
                      {project.openMrs}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge 
                      variant="secondary"
                      className="text-xs"
                    >
                      {project.openMilestonesCount}
                    </Badge>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {formatDate(project.lastActivityAt)}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        asChild 
                        size="sm" 
                        variant="outline"
                      >
                        <Link to={`/project/${project.id}`}>View</Link>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => syncSingleProject(project.id)}
                        disabled={syncingProjectId === project.id}
                        title="Refresh project statistics"
                      >
                        <RefreshCw 
                          className={`h-3 w-3 ${syncingProjectId === project.id ? 'animate-spin' : ''}`} 
                        />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        asChild
                        title="Open in GitLab"
                      >
                        <a
                          href={project.web_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
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
