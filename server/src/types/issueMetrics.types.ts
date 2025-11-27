// Issue Health Metrics Types

export interface IssueHealthMetrics {
  uuid: string;
  row_id: number;
  project_id: number;
  
  // Basic Counts
  total_open_issues: number;
  total_closed_issues: number;
  
  // Tier 1: Critical Metrics
  issues_closed_last_7d: number;
  issues_closed_last_30d: number;
  total_resolution_hours: number;
  issues_with_resolution_time: number;
  avg_cycle_time_hours: number;
  avg_cycle_time_days: number;
  issues_reopened_count: number;
  issues_checked_for_reopens: number;
  reopen_rate_percent: number;
  bug_issues_count: number;
  feature_issues_count: number;
  bug_ratio_percent: number;
  
  // Tier 2: Important Metrics
  issues_opened_last_7d: number;
  issues_opened_last_30d: number;
  net_issue_change_7d: number;
  stale_issues_count: number;
  stale_issues_percent: number;
  critical_issues_open: number;
  blocker_issues_open: number;
  critical_avg_resolution_hours: number;
  issues_with_mr_links: number;
  total_closed_issues_checked: number;
  issue_mr_link_rate_percent: number;
  
  // Alert Levels
  velocity_alert_level: string | null;
  cycle_time_alert_level: string | null;
  reopen_rate_alert_level: string | null;
  bug_ratio_alert_level: string | null;
  
  // Metadata
  calculated_at: Date;
}

export interface IssueMetricsHistory {
  uuid: string;
  row_id: number;
  project_id: number;
  total_open_issues: number;
  total_closed_issues: number;
  issues_closed_last_7d: number;
  avg_cycle_time_days: number;
  reopen_rate_percent: number;
  bug_ratio_percent: number;
  stale_issues_count: number;
  critical_issues_open: number;
  snapshot_date: Date;
}

// GitLab API Response Types for Issue Metrics

export interface GitLabIssueStateEvent {
  id: number;
  user: {
    id: number;
    username: string;
    name: string;
  };
  created_at: string;
  resource_type: string;
  resource_id: number;
  state: string;  // 'opened', 'closed', 'reopened'
}

export interface GitLabIssueLink {
  source_issue: {
    iid: number;
    title: string;
  };
  target_issue?: {
    iid: number;
    title: string;
  };
  link_type?: string;
}

export interface GitLabIssueMRReference {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  state: string;
  web_url: string;
}

// Calculation Input/Output Types

export interface IssueMetricsCalculationInput {
  projectId: number;
  openIssues: any[];
  closedIssuesLast7d: any[];
  closedIssuesLast30d: any[];
  openedIssuesLast7d: any[];
  openedIssuesLast30d: any[];
  bugIssues: any[];
  featureIssues: any[];
  criticalIssues: any[];
  blockerIssues: any[];
}

export interface IssueMetricsCalculationResult {
  // Basic counts
  total_open_issues: number;
  total_closed_issues: number;
  
  // Tier 1
  issues_closed_last_7d: number;
  issues_closed_last_30d: number;
  total_resolution_hours: number;
  issues_with_resolution_time: number;
  avg_cycle_time_hours: number;
  avg_cycle_time_days: number;
  issues_reopened_count: number;
  issues_checked_for_reopens: number;
  reopen_rate_percent: number;
  bug_issues_count: number;
  feature_issues_count: number;
  bug_ratio_percent: number;
  
  // Tier 2
  issues_opened_last_7d: number;
  issues_opened_last_30d: number;
  net_issue_change_7d: number;
  stale_issues_count: number;
  stale_issues_percent: number;
  critical_issues_open: number;
  blocker_issues_open: number;
  critical_avg_resolution_hours: number;
  issues_with_mr_links: number;
  total_closed_issues_checked: number;
  issue_mr_link_rate_percent: number;
  
  // Alert levels
  velocity_alert_level: string;
  cycle_time_alert_level: string;
  reopen_rate_alert_level: string;
  bug_ratio_alert_level: string;
}

export interface WeekOverWeekComparison {
  hasComparison: boolean;
  velocity_change: number | null;
  cycle_time_change: number | null;
  reopen_rate_change: number | null;
  bug_ratio_change: number | null;
  stale_issues_change: number | null;
  critical_issues_change: number | null;
}

export interface IssueMetricsTrends {
  velocity: WeekOverWeekComparison;
  cycle_time: WeekOverWeekComparison;
  reopen_rate: WeekOverWeekComparison;
  bug_ratio: WeekOverWeekComparison;
}
