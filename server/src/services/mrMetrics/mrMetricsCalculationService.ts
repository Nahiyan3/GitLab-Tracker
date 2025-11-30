// MR Metrics Calculation Service
// Business logic for calculating all MR health metrics
// Follows the same pattern as issueMetricsCalculationService.ts

import { GitLabMergeRequest } from '../../types/gitlab.types';
import { GitLabMRNote } from '../../types/mrMetrics.types';

class MRMetricsCalculationService {

  /**
   * Main calculation function - compute all MR metrics
   */
  calculateMetrics(
    projectId: number,
    openMRs: GitLabMergeRequest[],
    mergedMRsLast7d: GitLabMergeRequest[],
    mergedMRsLast30d: GitLabMergeRequest[],
    allRecentMergedMRs: GitLabMergeRequest[],
    openedMRsLast7d: GitLabMergeRequest[],
    openedMRsLast30d: GitLabMergeRequest[],
    totalOpenCount: number,
    totalMergedCount: number,
    commentsData: { totalComments: number; checked: number },
    revertData: { reverted: number; checked: number },
    reviewersData: { totalReviewers: number; checked: number }
  ) {
    // TIER 1: CRITICAL METRICS

    // Metric 1: MRs Merged Per Week
    const mrs_merged_last_7d = mergedMRsLast7d.length;
    const mrs_merged_last_30d = mergedMRsLast30d.length;

    // Metric 2: MR Merge Time
    const mergeTimeResult = this.calculateMergeTime(mergedMRsLast30d);

    // Metric 3: Review Comments Per MR
    const commentsResult = this.calculateAvgComments(
      commentsData.totalComments,
      commentsData.checked
    );

    // Metric 4: MR Revert Rate
    const revertResult = this.calculateRevertRate(
      revertData.reverted,
      revertData.checked
    );

    // TIER 2: IMPORTANT METRICS

    // Metric 5: MRs Opened Per Week
    const mrs_opened_last_7d = openedMRsLast7d.length;
    const mrs_opened_last_30d = openedMRsLast30d.length;
    const net_mr_change_7d = mrs_opened_last_7d - mrs_merged_last_7d;

    // Metric 6: Stale MRs
    const staleResult = this.calculateStaleMRs(openMRs);

    // Metric 7: Reviewers Per MR
    const reviewersResult = this.calculateAvgReviewers(
      reviewersData.totalReviewers,
      reviewersData.checked
    );

    // Metric 8: Closure Rate
    const closureRate = this.calculateClosureRate(
      mrs_merged_last_30d,
      mrs_opened_last_30d
    );

    // Calculate alert levels
    const merge_velocity_alert_level = this.getMergeVelocityAlertLevel(mrs_merged_last_30d);
    const merge_time_alert_level = this.getMergeTimeAlertLevel(
      mergeTimeResult.avg_merge_time_days
    );
    const revert_rate_alert_level = this.getRevertRateAlertLevel(
      revertResult.revert_rate_percent
    );
    const stale_mrs_alert_level = this.getStaleMRsAlertLevel(
      staleResult.stale_mrs_count
    );

    return {
      // Basic counts (using actual totals from API headers)
      total_open_mrs: totalOpenCount,
      total_merged_mrs: totalMergedCount,

      // Tier 1
      mrs_merged_last_7d,
      mrs_merged_last_30d,
      total_merge_time_hours: mergeTimeResult.total_merge_time_hours,
      mrs_with_merge_time: mergeTimeResult.mrs_with_merge_time,
      avg_merge_time_hours: mergeTimeResult.avg_merge_time_hours,
      avg_merge_time_days: mergeTimeResult.avg_merge_time_days,
      total_review_comments: commentsResult.total_review_comments,
      mrs_checked_for_comments: commentsResult.mrs_checked_for_comments,
      avg_review_comments_per_mr: commentsResult.avg_review_comments_per_mr,
      reverted_mrs_count: revertResult.reverted_mrs_count,
      mrs_checked_for_reverts: revertResult.mrs_checked_for_reverts,
      revert_rate_percent: revertResult.revert_rate_percent,

      // Tier 2
      mrs_opened_last_7d,
      mrs_opened_last_30d,
      net_mr_change_7d,
      stale_mrs_count: staleResult.stale_mrs_count,
      stale_mrs_percent: staleResult.stale_mrs_percent,
      total_reviewers_count: reviewersResult.total_reviewers_count,
      mrs_checked_for_reviewers: reviewersResult.mrs_checked_for_reviewers,
      avg_reviewers_per_mr: reviewersResult.avg_reviewers_per_mr,

      // Closure Rate
      closure_rate_percent: closureRate,

      // Alert levels
      merge_velocity_alert_level,
      merge_time_alert_level,
      revert_rate_alert_level,
      stale_mrs_alert_level,
    };
  }

  /**
   * Calculate average merge time
   */
  private calculateMergeTime(mergedMRs: GitLabMergeRequest[]) {
    let total_merge_time_hours = 0;
    let mrs_with_merge_time = 0;

    mergedMRs.forEach((mr) => {
      if (mr.created_at && mr.merged_at) {
        const mergeTimeMs =
          new Date(mr.merged_at).getTime() - new Date(mr.created_at).getTime();
        total_merge_time_hours += mergeTimeMs / (1000 * 60 * 60);
        mrs_with_merge_time++;
      }
    });

    const avg_merge_time_hours =
      mrs_with_merge_time > 0 ? total_merge_time_hours / mrs_with_merge_time : 0;
    const avg_merge_time_days = avg_merge_time_hours / 24;

    return {
      total_merge_time_hours: parseFloat(total_merge_time_hours.toFixed(2)),
      mrs_with_merge_time,
      avg_merge_time_hours: parseFloat(avg_merge_time_hours.toFixed(2)),
      avg_merge_time_days: parseFloat(avg_merge_time_days.toFixed(2)),
    };
  }

  /**
   * Calculate average review comments per MR
   */
  private calculateAvgComments(totalComments: number, checked: number) {
    const avg_review_comments_per_mr = checked > 0 ? totalComments / checked : 0;

    return {
      total_review_comments: totalComments,
      mrs_checked_for_comments: checked,
      avg_review_comments_per_mr: parseFloat(avg_review_comments_per_mr.toFixed(2)),
    };
  }

  /**
   * Calculate MR revert rate
   */
  private calculateRevertRate(reverted: number, checked: number) {
    const revert_rate_percent = checked > 0 ? (reverted / checked) * 100 : 0;

    return {
      reverted_mrs_count: reverted,
      mrs_checked_for_reverts: checked,
      revert_rate_percent: parseFloat(revert_rate_percent.toFixed(2)),
    };
  }

  /**
   * Calculate stale MRs (open >14 days with no activity)
   */
  private calculateStaleMRs(openMRs: GitLabMergeRequest[]) {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    let stale_mrs_count = 0;

    openMRs.forEach((mr) => {
      if (mr.updated_at) {
        const lastActivity = new Date(mr.updated_at);
        if (lastActivity < fourteenDaysAgo) {
          stale_mrs_count++;
        }
      }
    });

    const stale_mrs_percent =
      openMRs.length > 0 ? (stale_mrs_count / openMRs.length) * 100 : 0;

    return {
      stale_mrs_count,
      stale_mrs_percent: parseFloat(stale_mrs_percent.toFixed(2)),
    };
  }

  /**
   * Calculate average reviewers per MR
   */
  private calculateAvgReviewers(totalReviewers: number, checked: number) {
    const avg_reviewers_per_mr = checked > 0 ? totalReviewers / checked : 0;

    return {
      total_reviewers_count: totalReviewers,
      mrs_checked_for_reviewers: checked,
      avg_reviewers_per_mr: parseFloat(avg_reviewers_per_mr.toFixed(2)),
    };
  }

  // ========================================================================
  // ALERT LEVEL CALCULATIONS
  // ========================================================================

  /**
   * Get alert level for merge velocity (30-day basis)
   */
  private getMergeVelocityAlertLevel(mergedLast30d: number): string {
    if (mergedLast30d === 0) return 'RED_ALERT';
    if (mergedLast30d < 5) return 'WARNING';
    return 'NORMAL';
  }

  /**
   * Get alert level for merge time
   */
  private getMergeTimeAlertLevel(avgMergeTimeDays: number): string {
    if (avgMergeTimeDays > 7) return 'RED_ALERT';
    if (avgMergeTimeDays > 3) return 'WARNING';
    return 'NORMAL';
  }

  /**
   * Get alert level for revert rate
   */
  private getRevertRateAlertLevel(revertRatePercent: number): string {
    if (revertRatePercent > 10) return 'RED_ALERT';
    if (revertRatePercent > 5) return 'WARNING';
    return 'NORMAL';
  }

  /**
   * Calculate closure rate as simple ratio (merged/opened)
   */
  private calculateClosureRate(mergedLast30d: number, openedLast30d: number): number {
    if (openedLast30d === 0) {
      return 0;
    }
    const rate = mergedLast30d / openedLast30d;
    return parseFloat(rate.toFixed(2));
  }

  /**
   * Get alert level for stale MRs
   */
  private getStaleMRsAlertLevel(staleMRsCount: number): string {
    if (staleMRsCount > 10) return 'RED_ALERT';
    if (staleMRsCount > 5) return 'WARNING';
    return 'NORMAL';
  }
}

export default new MRMetricsCalculationService();
