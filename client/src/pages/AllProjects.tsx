import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Star, StarOff, ExternalLink, GitBranch, Eye, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface Project {
  id: number;
  name: string;
  description?: string;
  web_url: string;
  last_activity_at: string;
  visibility: string;
  star_count: number;
  forks_count: number;
  parent_id?: number;
  groupPath?: string;
  fullPath?: string;
  isTracked?: boolean;
}

interface Group {
  id : number;
  name: string;
  parent_id?: number| undefined;

}

 const groups: Group[] = [{
  name : 'Product',
  id : 1,
  parent_id : undefined

},
{
  name : 'Pivot-Repos',
  id : 2,
  parent_id : 1
}
,
{
  name : 'Pivot-Core',
  id : 3,
  parent_id : 2
},
{
  name : 'Pivot-bot',
  parent_id : 2,
  id : 4
}
]

const AllProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingProjectId, setSyncingProjectId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [trackFilter, setTrackFilter] = useState("all");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects/db');
      
      if (response.success) {
        setProjects(response.data);
        toast({
          title: "Projects loaded",
          description: `Successfully loaded ${response.data.length} projects from database`,
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load projects",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch projects from database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncProjects = async () => {
    try {
      setSyncing(true);
      const response = await api.post('/projects/sync', {});
      
      if (response.success) {
        setProjects(response.data);
        toast({
          title: "Projects synced",
          description: response.message || `Successfully synced ${response.data.length} projects from GitLab`,
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to sync projects",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync projects from GitLab",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const syncSingleProject = async (id: number) => {
    try {
      setSyncingProjectId(id);
      const response = await api.post(`/projects/sync/${id}`, {});
      
      if (response.success && response.data) {
        // Update only the synced project in the list
        setProjects(projects.map(p => 
          p.id === id ? response.data : p
        ));
        toast({
          title: "Project synced",
          description: response.message || `Successfully synced project from GitLab`,
        });
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to sync project",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync project from GitLab",
        variant: "destructive",
      });
    } finally {
      setSyncingProjectId(null);
    }
  };

  const toggleTracking = async (id: number) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    try {
      if (project.isTracked) {
        // Untrack
        const response = await api.patch(`/projects/untrack/${id}`);
        
        if (response.success) {
          setProjects(projects.map(p => 
            p.id === id ? { ...p, isTracked: false } : p
          ));
          toast({
            title: "Project untracked",
            description: `${project.name} is now untracked`,
          });
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to untrack project",
            variant: "destructive",
          });
        }
      } else {
        // Track
        const response = await api.post('/projects/track', {
          id: project.id,
        });
        
        if (response.success) {
          setProjects(projects.map(p => 
            p.id === id ? { ...p, isTracked: true } : p
          ));
          toast({
            title: "Project tracked",
            description: `${project.name} is now tracked`,
          });
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to track project",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tracking status",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         (p.description?.toLowerCase().includes(search.toLowerCase()));
    const matchesGroup = groupFilter === "all"; // No group data yet, so show all
    const matchesTrack = trackFilter === "all" || 
                        (trackFilter === "tracked" && p.isTracked) ||
                        (trackFilter === "untracked" && !p.isTracked);
    return matchesSearch && matchesGroup && matchesTrack;
  });

  const groups: string[] = []; // No group data yet from backend

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">All Projects</h1>
          <p className="text-muted-foreground">
            View and manage all GitLab projects across groups
          </p>
        </div>
        <Button 
          onClick={syncProjects} 
          disabled={syncing || loading}
          variant="outline"
          className="gap-2"
        >
          {syncing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Syncing...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Sync from GitLab
            </>
          )}
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map(group => (
                <SelectItem key={group} value={group}>{group}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={trackFilter} onValueChange={setTrackFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tracking status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="tracked">Tracked Only</SelectItem>
              <SelectItem value="untracked">Untracked Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            Loading projects from database...
          </div>
        </Card>
      )}

      {/* Projects Table */}
      {!loading && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b sticky top-0">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">Project Name</th>
                  <th className="text-left p-4 font-semibold text-sm">Group</th>
                  <th className="text-left p-4 font-semibold text-sm">Last Activity</th>
                  <th className="text-left p-4 font-semibold text-sm">Visibility</th>
                  <th className="text-left p-4 font-semibold text-sm">Stats</th>
                  <th className="text-left p-4 font-semibold text-sm">Status</th>
                  <th className="text-right p-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-medium">{project.name}</td>
                    <td className="p-4 text-muted-foreground text-sm">
                      {project.fullPath || project.groupPath || <span className="italic text-muted-foreground">No group</span>}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDate(project.last_activity_at)}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="capitalize">
                        {project.visibility}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {project.star_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3" />
                          {project.forks_count}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {project.isTracked ? (
                        <Badge variant="default">Tracked</Badge>
                      ) : (
                        <Badge variant="secondary">Untracked</Badge>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant={project.isTracked ? "destructive" : "default"}
                          onClick={() => toggleTracking(project.id)}
                        >
                          {project.isTracked ? (
                            <>
                              <StarOff className="h-3 w-3 mr-1" />
                              Untrack
                            </>
                          ) : (
                            <>
                              <Star className="h-3 w-3 mr-1" />
                              Track
                            </>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => syncSingleProject(project.id)}
                          disabled={syncingProjectId === project.id}
                          title="Sync this project from GitLab"
                        >
                          <RefreshCw className={`h-3 w-3 ${syncingProjectId === project.id ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => window.open(project.web_url, '_blank')}
                          title="Open in GitLab"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="text-sm text-muted-foreground text-center">
        Showing {filteredProjects.length} of {projects.length} projects
      </div>
    </div>
  );
};

export default AllProjects;
