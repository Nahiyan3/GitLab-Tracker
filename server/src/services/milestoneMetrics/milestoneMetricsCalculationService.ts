// Milestone Metrics Calculation Service
// Calculates max, min, and average issue counts for active milestones

import { MilestoneMetrics, MilestoneWithIssueCount } from '../../types/milestoneMetrics.types';

class MilestoneMetricsCalculationService {
  /**
   * Calculate milestone metrics from milestones with issue counts
   */
  calculateMetrics(milestonesWithCounts: MilestoneWithIssueCount[]): MilestoneMetrics {
    console.log(
      `[MilestoneMetricsCalculation] Calculating metrics for ${milestonesWithCounts.length} milestones`
    );

    // Handle empty case
    if (milestonesWithCounts.length === 0) {
      return {
        max_issues: 0,
        min_issues: 0,
        avg_issues: 0,
        total_milestones: 0,
        milestone_with_max_issues: null,
        milestone_with_min_issues: null,
      };
    }

    // Calculate max
    const maxMilestone = milestonesWithCounts.reduce((max, current) =>
      current.issue_count > max.issue_count ? current : max
    );

    // Calculate min
    const minMilestone = milestonesWithCounts.reduce((min, current) =>
      current.issue_count < min.issue_count ? current : min
    );

    // Calculate average
    const totalIssues = milestonesWithCounts.reduce(
      (sum, milestone) => sum + milestone.issue_count,
      0
    );
    const avgIssues = totalIssues / milestonesWithCounts.length;

    const metrics: MilestoneMetrics = {
      max_issues: maxMilestone.issue_count,
      min_issues: minMilestone.issue_count,
      avg_issues: Math.round(avgIssues * 10) / 10, // Round to 1 decimal place
      total_milestones: milestonesWithCounts.length,
      milestone_with_max_issues: maxMilestone.title,
      milestone_with_min_issues: minMilestone.title,
    };

    console.log('[MilestoneMetricsCalculation] Metrics calculated:', metrics);

    return metrics;
  }
}

export default new MilestoneMetricsCalculationService();
