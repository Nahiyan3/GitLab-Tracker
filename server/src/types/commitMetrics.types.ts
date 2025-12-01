// Commit Metrics Type Definitions
// Follows the same pattern as issueMetrics.types.ts and mrMetrics.types.ts

import { GitLabCommit } from './gitlab.types';

/**
 * Main Commit Health Metrics interface
 * Stored in commit_health_metrics table
 */
export interface CommitHealthMetrics {
  uuid: string;
  row_id: number;
  project_id: number;

  // Basic Counts
  total_commits_last_7d: number;

  // Metric 1: Average Commit Size
  total_lines_changed: number;
  commits_analyzed: number;
  avg_commit_size: number;

  // Metric 2: Lines Added vs Deleted
  total_lines_added: number;
  total_lines_deleted: number;
  lines_added_deleted_ratio: number;

  // Metric 3: Commits Per Week
  commits_per_week: number;

  // Metric 4: Bus Factor
  total_contributors: number;
  contributors_above_50_percent: number;
  bus_factor: number;

  // Raw commit data (for future analysis)
  commit_details: Array<{ sha: string; title: string; message: string; author: string; created_at: string }>;

  // Metadata
  calculated_at: string;
}

/**
 * Historical snapshot for trend analysis
 * Stored in commit_metrics_history table
 */
export interface CommitMetricsHistory {
  uuid: string;
  row_id: number;
  project_id: number;
  
  total_commits_last_7d: number;
  avg_commit_size: number;
  total_lines_added: number;
  total_lines_deleted: number;
  bus_factor: number;
  
  snapshot_date: string;
}

/**
 * Result of commit metrics calculation
 * Used internally before saving to database
 */
export interface CommitMetricsCalculationResult {
  total_commits_last_7d: number;
  total_lines_changed: number;
  commits_analyzed: number;
  avg_commit_size: number;
  total_lines_added: number;
  total_lines_deleted: number;
  lines_added_deleted_ratio: number;
  commits_per_week: number;
  total_contributors: number;
  contributors_above_50_percent: number;
  bus_factor: number;
  commit_details: Array<{ sha: string; title: string; message: string; author: string; created_at: string }>;
}

/**
 * GitLab commit with stats
 */
export interface GitLabCommitWithStats extends GitLabCommit {
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

/**
 * Contributor commit data
 */
export interface ContributorCommitData {
  author_email: string;
  author_name: string;
  commit_count: number;
}
