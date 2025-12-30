import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type MetricType = "deployment" | "leadtime" | "failure" | "restore" | null;

interface DeploymentForm {
  deploymentId: string;
  version: string;
  environment: string;
  timestamp: string;
}

interface LeadTimeForm {
  changeId: string;
  mergedTimestamp: string;
  deployedTimestamp: string;
}

interface FailureForm {
  deploymentId: string;
  deploymentTimestamp: string;
  hasIncident: boolean;
  remediationType: string;
}

interface RestoreForm {
  incidentId: string;
  startTime: string;
  endTime: string;
  description: string;
}

const DoraMetricsInput = () => {
  const { id } = useParams();
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(null);
  
  // Autocomplete state for deployment search
  const [deploymentSearchTerm, setDeploymentSearchTerm] = useState("");
  const [deploymentSuggestions, setDeploymentSuggestions] = useState<any[]>([]);
  const [showDeploymentSuggestions, setShowDeploymentSuggestions] = useState(false);
  
  // Form states
  const [deploymentForm, setDeploymentForm] = useState<DeploymentForm>({
    deploymentId: "",
    version: "",
    environment: "production",
    timestamp: "",
  });

  const [leadTimeForm, setLeadTimeForm] = useState<LeadTimeForm>({
    changeId: "",
    mergedTimestamp: "",
    deployedTimestamp: "",
  });

  const [failureForm, setFailureForm] = useState<FailureForm>({
    deploymentId: "",
    deploymentTimestamp: "",
    hasIncident: false,
    remediationType: "none",
  });

  const [restoreForm, setRestoreForm] = useState<RestoreForm>({
    incidentId: "",
    startTime: "",
    endTime: "",
    description: "",
  });

  const handleMetricSelection = (metric: string) => {
    setSelectedMetric(metric as MetricType);
  };

  // Autocomplete: Search deployments as user types
  const handleDeploymentSearch = async (searchTerm: string) => {
    setDeploymentSearchTerm(searchTerm);
    
    if (searchTerm.length < 1) {
      setDeploymentSuggestions([]);
      setShowDeploymentSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/projects/${id}/dora/deployment/search?q=${encodeURIComponent(searchTerm)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setDeploymentSuggestions(data.data);
        setShowDeploymentSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching deployments:', error);
    }
  };

  // Autocomplete: Select a deployment and auto-fill form
  const handleDeploymentSelect = (deployment: any) => {
    setFailureForm({
      ...failureForm,
      deploymentId: deployment.deployment_id,
      deploymentTimestamp: new Date(deployment.deployment_timestamp).toISOString().slice(0, 16),
    });
    setDeploymentSearchTerm(deployment.deployment_id);
    setShowDeploymentSuggestions(false);
  };

  const handleDeploymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!deploymentForm.deploymentId || !deploymentForm.timestamp) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // API call to save deployment
      const response = await fetch(`http://localhost:5000/api/projects/${id}/dora/deployment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deployment_id: deploymentForm.deploymentId,
          version: deploymentForm.version,
          environment: deploymentForm.environment,
          deployment_timestamp: deploymentForm.timestamp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save deployment');
      }

      toast({
        title: "Success",
        description: "Deployment logged successfully",
      });

      // Reset form
      setDeploymentForm({
        deploymentId: "",
        version: "",
        environment: "production",
        timestamp: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save deployment",
        variant: "destructive",
      });
    }
  };

  const handleLeadTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leadTimeForm.changeId || !leadTimeForm.mergedTimestamp || !leadTimeForm.deployedTimestamp) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // API call to save lead time data
      const response = await fetch(`http://localhost:5000/api/projects/${id}/dora/leadtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          change_id: leadTimeForm.changeId,
          merged_timestamp: leadTimeForm.mergedTimestamp,
          deployed_timestamp: leadTimeForm.deployedTimestamp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save lead time data');
      }

      toast({
        title: "Success",
        description: "Lead time data logged successfully",
      });

      setLeadTimeForm({
        changeId: "",
        mergedTimestamp: "",
        deployedTimestamp: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save lead time data",
        variant: "destructive",
      });
    }
  };

  const handleFailureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!failureForm.deploymentId || !failureForm.deploymentTimestamp) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // API call to save failure data
      const response = await fetch(`http://localhost:5000/api/projects/${id}/dora/failure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deployment_id: failureForm.deploymentId,
          deployment_timestamp: failureForm.deploymentTimestamp,
          has_incident: failureForm.hasIncident,
          remediation_type: failureForm.remediationType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save failure data');
      }

      toast({
        title: "Success",
        description: "Failure data logged successfully",
      });

      setFailureForm({
        deploymentId: "",
        deploymentTimestamp: "",
        hasIncident: false,
        remediationType: "none",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save failure data",
        variant: "destructive",
      });
    }
  };

  const handleRestoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restoreForm.incidentId || !restoreForm.startTime || !restoreForm.endTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate end time is after start time
    if (new Date(restoreForm.endTime) <= new Date(restoreForm.startTime)) {
      toast({
        title: "Validation Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    try {
      // API call to save restore time data
      const response = await fetch(`http://localhost:5000/api/projects/${id}/dora/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incident_id: restoreForm.incidentId,
          start_time: restoreForm.startTime,
          end_time: restoreForm.endTime,
          description: restoreForm.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save restore time');
      }

      toast({
        title: "Success",
        description: "Incident restore time logged successfully",
      });

      setRestoreForm({
        incidentId: "",
        startTime: "",
        endTime: "",
        description: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save restore time",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/tracked-projects`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">DORA Metrics - Manual Input</h1>
          <p className="text-muted-foreground">
            Log deployment and incident data for Project #{id}
          </p>
        </div>
      </div>

      {/* Metric Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Metric Type</CardTitle>
          <CardDescription>
            Choose which DORA metric you want to log data for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant={selectedMetric === "deployment" ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-start"
              onClick={() => handleMetricSelection("deployment")}
            >
              <div className="font-semibold text-lg mb-1">Deployment Frequency</div>
              <div className="text-sm text-left opacity-80">
                Log production deployments
              </div>
            </Button>

            <Button
              variant={selectedMetric === "leadtime" ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-start"
              onClick={() => handleMetricSelection("leadtime")}
            >
              <div className="font-semibold text-lg mb-1">Lead Time for Changes</div>
              <div className="text-sm text-left opacity-80">
                Track time from merge to deployment
              </div>
            </Button>

            <Button
              variant={selectedMetric === "failure" ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-start"
              onClick={() => handleMetricSelection("failure")}
            >
              <div className="font-semibold text-lg mb-1">Change Failure Rate</div>
              <div className="text-sm text-left opacity-80">
                Log deployment failures and incidents
              </div>
            </Button>

            <Button
              variant={selectedMetric === "restore" ? "default" : "outline"}
              className="h-auto p-4 flex flex-col items-start"
              onClick={() => handleMetricSelection("restore")}
            >
              <div className="font-semibold text-lg mb-1">Time to Restore Service</div>
              <div className="text-sm text-left opacity-80">
                Log incident resolution times
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Frequency Form */}
      {selectedMetric === "deployment" && (
        <Card>
          <CardHeader>
            <CardTitle>Log Production Deployment</CardTitle>
            <CardDescription>
              Record a new production deployment event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDeploymentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deploymentId">
                    Deployment ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="deploymentId"
                    placeholder="e.g., deploy-2024-001"
                    value={deploymentForm.deploymentId}
                    onChange={(e) =>
                      setDeploymentForm({ ...deploymentForm, deploymentId: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="version">Version / Tag</Label>
                  <Input
                    id="version"
                    placeholder="e.g., v1.2.3"
                    value={deploymentForm.version}
                    onChange={(e) =>
                      setDeploymentForm({ ...deploymentForm, version: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="environment">Environment</Label>
                  <Select
                    value={deploymentForm.environment}
                    onValueChange={(value) =>
                      setDeploymentForm({ ...deploymentForm, environment: value })
                    }
                  >
                    <SelectTrigger id="environment">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Only Production deployments count towards DORA metrics
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timestamp">
                    Deployment Timestamp <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="timestamp"
                    type="datetime-local"
                    value={deploymentForm.timestamp}
                    onChange={(e) =>
                      setDeploymentForm({ ...deploymentForm, timestamp: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedMetric(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save Deployment
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lead Time for Changes Form */}
      {selectedMetric === "leadtime" && (
        <Card>
          <CardHeader>
            <CardTitle>Log Lead Time for Change</CardTitle>
            <CardDescription>
              Track time from code merge to production deployment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLeadTimeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="changeId">
                  Change ID (MR/PR/Ticket) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="changeId"
                  placeholder="e.g., MR-123, PR-456, TICKET-789"
                  value={leadTimeForm.changeId}
                  onChange={(e) =>
                    setLeadTimeForm({ ...leadTimeForm, changeId: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mergedTimestamp">
                    Merged/Approved Timestamp <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mergedTimestamp"
                    type="datetime-local"
                    value={leadTimeForm.mergedTimestamp}
                    onChange={(e) =>
                      setLeadTimeForm({ ...leadTimeForm, mergedTimestamp: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    When the code was ready/merged
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deployedTimestamp">
                    Deployed to Production <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="deployedTimestamp"
                    type="datetime-local"
                    value={leadTimeForm.deployedTimestamp}
                    onChange={(e) =>
                      setLeadTimeForm({ ...leadTimeForm, deployedTimestamp: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    When it was deployed to production
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedMetric(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save Lead Time Data
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Change Failure Rate Form */}
      {selectedMetric === "failure" && (
        <Card>
          <CardHeader>
            <CardTitle>Log Change Failure</CardTitle>
            <CardDescription>
              Track deployments that caused incidents requiring remediation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFailureSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="failureDeploymentId">
                    Deployment ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="failureDeploymentId"
                    placeholder="Start typing deployment ID..."
                    value={deploymentSearchTerm}
                    onChange={(e) => handleDeploymentSearch(e.target.value)}
                    onFocus={() => deploymentSuggestions.length > 0 && setShowDeploymentSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowDeploymentSuggestions(false), 200)}
                    required
                  />
                  {showDeploymentSuggestions && deploymentSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {deploymentSuggestions.map((deployment) => (
                        <button
                          key={deployment.uuid}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-muted flex justify-between items-center"
                          onClick={() => handleDeploymentSelect(deployment)}
                        >
                          <div>
                            <div className="font-medium">{deployment.deployment_id}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(deployment.deployment_timestamp).toLocaleString()} • {deployment.environment}
                            </div>
                          </div>
                          {deployment.version && (
                            <span className="text-xs bg-muted px-2 py-1 rounded">{deployment.version}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Search from existing deployments
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="failureTimestamp">
                    Deployment Timestamp <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="failureTimestamp"
                    type="datetime-local"
                    value={failureForm.deploymentTimestamp}
                    onChange={(e) =>
                      setFailureForm({ ...failureForm, deploymentTimestamp: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-filled from selected deployment
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Did this deployment cause an incident? <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={failureForm.hasIncident ? "yes" : "no"}
                  onValueChange={(value) =>
                    setFailureForm({ ...failureForm, hasIncident: value === "yes" })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="incident-yes" />
                    <Label htmlFor="incident-yes" className="font-normal cursor-pointer">
                      Yes, an incident occurred
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="incident-no" />
                    <Label htmlFor="incident-no" className="font-normal cursor-pointer">
                      No, deployment was successful
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {failureForm.hasIncident && (
                <div className="space-y-2">
                  <Label htmlFor="remediationType">
                    Remediation Action <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={failureForm.remediationType}
                    onValueChange={(value) =>
                      setFailureForm({ ...failureForm, remediationType: value })
                    }
                  >
                    <SelectTrigger id="remediationType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rollback">Rollback</SelectItem>
                      <SelectItem value="hotfix">Hotfix</SelectItem>
                      <SelectItem value="emergency">Emergency Fix</SelectItem>
                      <SelectItem value="none">None Required</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Only rollback, hotfix, or emergency fix count as failures
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedMetric(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save Failure Data
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Time to Restore Service Form */}
      {selectedMetric === "restore" && (
        <Card>
          <CardHeader>
            <CardTitle>Log Incident Resolution</CardTitle>
            <CardDescription>
              Track time taken to restore service after an incident
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRestoreSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="incidentId">
                  Incident ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="incidentId"
                  placeholder="e.g., INC-2024-001"
                  value={restoreForm.incidentId}
                  onChange={(e) =>
                    setRestoreForm({ ...restoreForm, incidentId: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">
                    Incident Start Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={restoreForm.startTime}
                    onChange={(e) =>
                      setRestoreForm({ ...restoreForm, startTime: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    When user impact began
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">
                    Service Restored Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={restoreForm.endTime}
                    onChange={(e) =>
                      setRestoreForm({ ...restoreForm, endTime: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    When service was fully restored
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Incident Description (Optional)</Label>
                <textarea
                  id="description"
                  className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
                  placeholder="Brief description of the incident and resolution..."
                  value={restoreForm.description}
                  onChange={(e) =>
                    setRestoreForm({ ...restoreForm, description: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedMetric(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  Save Incident Data
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!selectedMetric && (
        <Card className="bg-muted/50">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a metric type above to begin logging data</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DoraMetricsInput;
