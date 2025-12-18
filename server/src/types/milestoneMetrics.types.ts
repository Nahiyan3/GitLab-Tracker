// Milestone Metrics Types
// Type definitions for milestone metrics

export interface MilestoneMetrics {
  max_issues: number;
  min_issues: number;
  avg_issues: number;
  total_milestones: number;
  milestone_with_max_issues: string | null;
  milestone_with_min_issues: string | null;
  calculated_at?: string;
}

export interface MilestoneWithIssueCount {
  id: number;
  title: string;
  issue_count: number;
  due_date: string | null;
}
