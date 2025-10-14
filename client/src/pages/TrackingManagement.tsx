import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TrackedProject {
  id: string;
  name: string;
  group: string;
  dateStarted: string;
  lastSync: string;
  status: "active" | "syncing" | "error";
}

const mockTrackedProjects: TrackedProject[] = [
  {
    id: "1",
    name: "web-app",
    group: "Frontend",
    dateStarted: "2024-01-15",
    lastSync: "2 hours ago",
    status: "active",
  },
  {
    id: "2",
    name: "api-service",
    group: "Backend",
    dateStarted: "2024-01-10",
    lastSync: "30 min ago",
    status: "active",
  },
  {
    id: "3",
    name: "data-pipeline",
    group: "Data",
    dateStarted: "2024-02-01",
    lastSync: "5 min ago",
    status: "syncing",
  },
  {
    id: "4",
    name: "auth-service",
    group: "Backend",
    dateStarted: "2024-01-20",
    lastSync: "1 hour ago",
    status: "active",
  },
  {
    id: "5",
    name: "legacy-api",
    group: "Backend",
    dateStarted: "2024-03-01",
    lastSync: "Failed",
    status: "error",
  },
];

const TrackingManagement = () => {
  const [projects, setProjects] = useState(mockTrackedProjects);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const toggleAll = () => {
    if (selected.size === projects.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(projects.map(p => p.id)));
    }
  };

  const handleBulkUntrack = () => {
    setProjects(projects.filter(p => !selected.has(p.id)));
    setSelected(new Set());
    toast({
      title: "Projects untracked",
      description: `${selected.size} project(s) removed from tracking`,
    });
  };

  const handleUntrack = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
    toast({
      title: "Project untracked",
      description: "Project removed from tracking",
    });
  };

  const getStatusBadge = (status: TrackedProject["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "syncing":
        return <Badge variant="warning">Syncing</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tracking Management</h1>
          <p className="text-muted-foreground">
            Manage tracked projects and data collection
          </p>
        </div>
        {selected.size > 0 && (
          <Button variant="destructive" onClick={handleBulkUntrack}>
            <Trash2 className="h-4 w-4 mr-2" />
            Untrack Selected ({selected.size})
          </Button>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b sticky top-0">
              <tr>
                <th className="p-4 text-left w-12">
                  <Checkbox
                    checked={selected.size === projects.length}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="text-left p-4 font-semibold text-sm">Project Name</th>
                <th className="text-left p-4 font-semibold text-sm">Group</th>
                <th className="text-left p-4 font-semibold text-sm">Date Started</th>
                <th className="text-left p-4 font-semibold text-sm">Last Sync</th>
                <th className="text-left p-4 font-semibold text-sm">Status</th>
                <th className="text-right p-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-4">
                    <Checkbox
                      checked={selected.has(project.id)}
                      onCheckedChange={() => toggleSelection(project.id)}
                    />
                  </td>
                  <td className="p-4 font-medium">{project.name}</td>
                  <td className="p-4 text-muted-foreground">{project.group}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(project.dateStarted).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{project.lastSync}</td>
                  <td className="p-4">{getStatusBadge(project.status)}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Sync
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleUntrack(project.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-2">Data Retention Policy</h3>
        <p className="text-sm text-muted-foreground">
          Project metrics and snapshots are retained for 90 days. Historical data is available in the Snapshots tab of each project.
        </p>
      </Card>
    </div>
  );
};

export default TrackingManagement;
