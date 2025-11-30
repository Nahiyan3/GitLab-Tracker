// MR Metrics Type Definitions
// Follows the same pattern as issueMetrics.types.ts

import { GitLabMergeRequest } from './gitlab.types';

/**
 * Main MR Health Metrics interface
 * Stored in mr_health_metrics table
 */
export interface MRHealthMetrics {
  uuid: string;
  row_id: number;
  project_id: number;

  // Basic Counts
  total_open_mrs: number;
  total_merged_mrs: number;

  // TIER 1: CRITICAL METRICS

  // Metric 1: MRs Merged Per Week
  mrs_merged_last_7d: number;
  mrs_merged_last_30d: number;

  // Metric 2: MR Merge Time
  total_merge_time_hours: number;
  mrs_with_merge_time: number;
  avg_merge_time_hours: number;
  avg_merge_time_days: number;

  // Metric 3: Review Comments Per MR
  total_review_comments: number;
  mrs_checked_for_comments: number;
  avg_review_comments_per_mr: number;

  // Metric 4: MR Revert Rate
  reverted_mrs_count: number;
  mrs_checked_for_reverts: number;
  revert_rate_percent: number;

  // TIER 2: IMPORTANT METRICS

  // Metric 5: MRs Opened Per Week
  mrs_opened_last_7d: number;
  mrs_opened_last_30d: number;
  net_mr_change_7d: number;

  // Metric 6: Stale MRs
  stale_mrs_count: number;
  stale_mrs_percent: number;

  // Metric 7: Reviewers Per MR
  total_reviewers_count: number;
  mrs_checked_for_reviewers: number;
  avg_reviewers_per_mr: number;

  // Closure Rate
  closure_rate_percent: number;

  // Alert levels
  merge_velocity_alert_level: string | null;
  merge_time_alert_level: string | null;
  revert_rate_alert_level: string | null;
  stale_mrs_alert_level: string | null;

  // Metadata
  calculated_at: string;
}

/**
 * Historical snapshot for trend analysis
 * Stored in mr_metrics_history table
 */
export interface MRMetricsHistory {
  uuid: string;
  row_id: number;
  project_id: number;
  
  total_open_mrs: number;
  total_merged_mrs: number;
  mrs_merged_last_7d: number;
  avg_merge_time_days: number;
  avg_review_comments_per_mr: number;
  revert_rate_percent: number;
  stale_mrs_count: number;
  avg_reviewers_per_mr: number;
  closure_rate_percent: number;
  mrs_merged_last_30d: number;
  mrs_opened_last_30d: number;
  
  snapshot_date: string;
}

/**
 * Week-over-week comparison data
 */
export interface MRWeekOverWeekComparison {
  hasComparison: boolean;
  merge_velocity_change: number | null;
  merge_time_change: number | null;
  revert_rate_change: number | null;
  stale_mrs_change: number | null;
}

/**
 * GitLab MR Discussion/Note
 */
export interface GitLabMRNote {
  id: number;
  type?: string;
  body: string;
  author: {
    id: number;
    username: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
  system: boolean;
  noteable_id: number;
  noteable_type: string;
}

/**
 * GitLab MR Reviewer
 */
export interface GitLabMRReviewer {
  user: {
    id: number;
    username: string;
    name: string;
  };
}

/**
 * Data structure for fetchGitLabData return
 */
export interface MRFetchData {
  openMRs: GitLabMergeRequest[];
  mergedMRsLast7d: GitLabMergeRequest[];
  mergedMRsLast30d: GitLabMergeRequest[];
  allRecentMergedMRs: GitLabMergeRequest[];
  openedMRsLast7d: GitLabMergeRequest[];
  openedMRsLast30d: GitLabMergeRequest[];
  totalOpenCount: number;
  totalMergedCount: number;
  commentsData: {
    totalComments: number;
    checked: number;
  };
  revertData: {
    reverted: number;
    checked: number;
  };
  reviewersData: {
    totalReviewers: number;
    checked: number;
  };
}
