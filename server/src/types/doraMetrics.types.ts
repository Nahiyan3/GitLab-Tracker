// DORA Metrics Types

export interface DeploymentFrequency {
  id: number;
  uuid: string;
  project_id: number;
  deployment_id: string;
  version?: string;
  environment: 'production' | 'staging' | 'development';
  deployment_timestamp: Date;
  created_at: Date;
  updated_at: Date;
}

export interface DeploymentFrequencyInput {
  project_id: number;
  deployment_id: string;
  version?: string;
  environment: 'production' | 'staging' | 'development';
  deployment_timestamp: string;
}

export interface LeadTimeChange {
  id: number;
  uuid: string;
  project_id: number;
  change_id: string;
  merged_timestamp: Date;
  deployed_timestamp: Date;
  lead_time_hours: number;
  created_at: Date;
  updated_at: Date;
}

export interface LeadTimeChangeInput {
  project_id: number;
  change_id: string;
  merged_timestamp: string;
  deployed_timestamp: string;
}

export interface ChangeFailureRate {
  id: number;
  uuid: string;
  project_id: number;
  deployment_id: string;
  deployment_timestamp: Date;
  has_incident: boolean;
  remediation_type: 'none' | 'rollback' | 'hotfix' | 'emergency';
  is_failure: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ChangeFailureRateInput {
  project_id: number;
  deployment_id: string;
  deployment_timestamp: string;
  has_incident: boolean;
  remediation_type: 'none' | 'rollback' | 'hotfix' | 'emergency';
}

export interface TimeToRestoreService {
  id: number;
  uuid: string;
  project_id: number;
  incident_id: string;
  start_time: Date;
  end_time: Date;
  restore_time_hours: number;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TimeToRestoreServiceInput {
  project_id: number;
  incident_id: string;
  start_time: string;
  end_time: string;
  description?: string;
}

// Aggregated metrics for dashboard
export interface DoraMetricsSummary {
  project_id: number;
  deployment_frequency: {
    total_deployments: number;
    production_deployments: number;
    deployments_per_day: number;
    deployments_per_week: number;
    deployments_per_month: number;
  };
  lead_time: {
    total_changes: number;
    avg_lead_time_hours: number;
    median_lead_time_hours: number;
    min_lead_time_hours: number;
    max_lead_time_hours: number;
  };
  change_failure_rate: {
    total_deployments: number;
    failed_deployments: number;
    failure_rate_percent: number;
  };
  time_to_restore: {
    total_incidents: number;
    avg_restore_time_hours: number;
    median_restore_time_hours: number;
    min_restore_time_hours: number;
    max_restore_time_hours: number;
  };
}
