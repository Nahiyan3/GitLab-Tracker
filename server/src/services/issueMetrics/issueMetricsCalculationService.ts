// Issue Metrics Calculation Service
// This service handles all calculations for issue health metrics

import { GitLabIssues } from '../../types/gitlab.types';
import { 
  IssueMetricsCalculationResult, 
  GitLabIssueStateEvent 
} from '../../types/issueMetrics.types';

class IssueMetricsCalculationService {

  /**
   * Calculate all issue metrics from fetched data
   */
  calculateMetrics(
    projectId: number,
    openIssues: GitLabIssues[],
    closedIssuesLast7d: GitLabIssues[],
    closedIssuesLast30d: GitLabIssues[],
    openedIssuesLast7d: GitLabIssues[],
    openedIssuesLast30d: GitLabIssues[],
    bugIssues: GitLabIssues[],
    featureIssues: GitLabIssues[],
    criticalIssues: GitLabIssues[],
    blockerIssues: GitLabIssues[],
    totalOpenCount: number,
    totalClosedCount: number,
    reopenData: { reopened: number; checked: number },
    mrLinkData: { withLinks: number; checked: number }
  ): IssueMetricsCalculationResult {

    console.log(`[IssueMetrics] Calculating metrics for project ${projectId}`);

    // TIER 1: CRITICAL METRICS

    // Metric 1: Velocity (Issues Closed Per Week)
    const issues_closed_last_7d = closedIssuesLast7d.length;
    const issues_closed_last_30d = closedIssuesLast30d.length;
    
    console.log(`[IssueMetrics] DEBUG - Calculated issues_closed_last_30d = ${issues_closed_last_30d}`);

    // Metric 2: Issue Cycle Time
    const cycleTimeResult = this.calculateCycleTime(closedIssuesLast30d);

    // Metric 3: Issue Reopen Rate
    const reopenRateResult = this.calculateReopenRate(
      reopenData.reopened,
      reopenData.checked
    );

    // Metric 4: Bug vs Feature Ratio
    const bugRatioResult = this.calculateBugRatio(bugIssues.length, featureIssues.length);

    // TIER 2: IMPORTANT METRICS

    // Metric 5: Issues Opened Per Week
    const issues_opened_last_7d = openedIssuesLast7d.length;
    const issues_opened_last_30d = openedIssuesLast30d.length;
    const net_issue_change_7d = issues_opened_last_7d - issues_closed_last_7d;

    // Metric 6: Stale Issues
    const staleResult = this.calculateStaleIssues(openIssues);

    // Metric 7: Critical/Blocker Issues
    const criticalResult = this.calculateCriticalMetrics(criticalIssues, blockerIssues);

    // Metric 8: Issue-to-MR Link Rate
    const mrLinkResult = this.calculateMRLinkRate(
      mrLinkData.withLinks,
      mrLinkData.checked
    );

    // Metric 9: Closure Rate
    const closureRate = this.calculateClosureRate(
      issues_closed_last_30d,
      issues_opened_last_30d
    );

      // Calculate alert levels (using 30-day velocity)
      const velocity_alert_level = this.getVelocityAlertLevel(issues_closed_last_30d);
    const cycle_time_alert_level = this.getCycleTimeAlertLevel(
      cycleTimeResult.avg_cycle_time_days
    );
    const reopen_rate_alert_level = this.getReopenRateAlertLevel(
      reopenRateResult.reopen_rate_percent
    );
    const bug_ratio_alert_level = this.getBugRatioAlertLevel(
      bugRatioResult.bug_ratio_percent
    );

    return {
      // Basic counts (using actual totals from API headers, not fetched array length)
      total_open_issues: totalOpenCount,
      total_closed_issues: totalClosedCount,

      // Tier 1
      issues_closed_last_7d,
      issues_closed_last_30d,
      total_resolution_hours: cycleTimeResult.total_resolution_hours,
      issues_with_resolution_time: cycleTimeResult.issues_with_resolution_time,
      avg_cycle_time_hours: cycleTimeResult.avg_cycle_time_hours,
      avg_cycle_time_days: cycleTimeResult.avg_cycle_time_days,
      issues_reopened_count: reopenRateResult.issues_reopened_count,
      issues_checked_for_reopens: reopenRateResult.issues_checked_for_reopens,
      reopen_rate_percent: reopenRateResult.reopen_rate_percent,
      bug_issues_count: bugRatioResult.bug_issues_count,
      feature_issues_count: bugRatioResult.feature_issues_count,
      bug_ratio_percent: bugRatioResult.bug_ratio_percent,

      // Tier 2
      issues_opened_last_7d,
      issues_opened_last_30d,
      net_issue_change_7d,
      stale_issues_count: staleResult.stale_issues_count,
      stale_issues_percent: staleResult.stale_issues_percent,
      critical_issues_open: criticalResult.critical_issues_open,
      blocker_issues_open: criticalResult.blocker_issues_open,
      critical_avg_resolution_hours: criticalResult.critical_avg_resolution_hours,
      issues_with_mr_links: mrLinkResult.issues_with_mr_links,
      total_closed_issues_checked: mrLinkResult.total_closed_issues_checked,
      issue_mr_link_rate_percent: mrLinkResult.issue_mr_link_rate_percent,

      // Closure Rate
      closure_rate_percent: closureRate,

      // Alert levels
      velocity_alert_level,
      cycle_time_alert_level,
      reopen_rate_alert_level,
      bug_ratio_alert_level,
    };
  }

  /**
   * Calculate cycle time metrics
   */
  private calculateCycleTime(closedIssues: GitLabIssues[]) {
    let total_resolution_hours = 0;
    let issues_with_resolution_time = 0;

    console.log(`[CycleTime] Processing ${closedIssues.length} closed issues for cycle time calculation`);
    
    closedIssues.forEach((issue, index) => {
      if (issue.created_at && issue.closed_at) {
        const createdDate = new Date(issue.created_at);
        const closedDate = new Date(issue.closed_at);
        const resolutionMs = closedDate.getTime() - createdDate.getTime();
        const resolutionHours = resolutionMs / (1000 * 60 * 60);

        if (resolutionHours > 0) {
          total_resolution_hours += resolutionHours;
          issues_with_resolution_time++;
          
          // Log first few for debugging
          if (index < 3) {
            console.log(`[CycleTime] Issue ${issue.iid}: ${resolutionHours.toFixed(2)} hours (${(resolutionHours/24).toFixed(2)} days)`);
          }
        }
      } else {
        // Log issues without proper dates
        if (index < 3) {
          console.log(`[CycleTime] Issue ${issue.iid}: Missing dates - created_at: ${issue.created_at}, closed_at: ${issue.closed_at}`);
        }
      }
    });

    const avg_cycle_time_hours =
      issues_with_resolution_time > 0
        ? total_resolution_hours / issues_with_resolution_time
        : 0;

    const avg_cycle_time_days = avg_cycle_time_hours / 24;

    console.log(`[CycleTime] Result: ${issues_with_resolution_time} issues with valid times, avg ${avg_cycle_time_days.toFixed(2)} days`);

    return {
      total_resolution_hours: parseFloat(total_resolution_hours.toFixed(2)),
      issues_with_resolution_time,
      avg_cycle_time_hours: parseFloat(avg_cycle_time_hours.toFixed(2)),
      avg_cycle_time_days: parseFloat(avg_cycle_time_days.toFixed(2)),
    };
  }

  /**
   * Calculate reopen rate
   */
  private calculateReopenRate(reopenedCount: number, checkedCount: number) {
    const reopen_rate_percent =
      checkedCount > 0 ? (reopenedCount / checkedCount) * 100 : 0;

    return {
      issues_reopened_count: reopenedCount,
      issues_checked_for_reopens: checkedCount,
      reopen_rate_percent: parseFloat(reopen_rate_percent.toFixed(2)),
    };
  }

  /**
   * Calculate bug ratio
   */
  private calculateBugRatio(bugCount: number, featureCount: number) {
    const total = bugCount + featureCount;
    const bug_ratio_percent = total > 0 ? (bugCount / total) * 100 : 0;

    return {
      bug_issues_count: bugCount,
      feature_issues_count: featureCount,
      bug_ratio_percent: parseFloat(bug_ratio_percent.toFixed(2)),
    };
  }

  /**
   * Calculate stale issues (open >60 days with no activity)
   */
  private calculateStaleIssues(openIssues: GitLabIssues[]) {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    let stale_issues_count = 0;

    openIssues.forEach((issue) => {
      if (issue.updated_at) {
        const lastActivity = new Date(issue.updated_at);
        if (lastActivity < sixtyDaysAgo) {
          stale_issues_count++;
        }
      }
    });

    const stale_issues_percent =
      openIssues.length > 0 ? (stale_issues_count / openIssues.length) * 100 : 0;

    return {
      stale_issues_count,
      stale_issues_percent: parseFloat(stale_issues_percent.toFixed(2)),
    };
  }

  /**
   * Calculate critical/blocker metrics
   */
  private calculateCriticalMetrics(
    criticalIssues: GitLabIssues[],
    blockerIssues: GitLabIssues[]
  ) {
    const critical_issues_open = criticalIssues.filter(
      (i) => i.state === 'opened'
    ).length;
    const blocker_issues_open = blockerIssues.filter(
      (i) => i.state === 'opened'
    ).length;

    // Calculate average resolution time for closed critical issues
    const closedCritical = criticalIssues.filter((i) => i.state === 'closed');
    let totalResolutionHours = 0;
    let count = 0;

    closedCritical.forEach((issue) => {
      if (issue.created_at && issue.closed_at) {
        const resolutionMs =
          new Date(issue.closed_at).getTime() - new Date(issue.created_at).getTime();
        totalResolutionHours += resolutionMs / (1000 * 60 * 60);
        count++;
      }
    });

    const critical_avg_resolution_hours =
      count > 0 ? totalResolutionHours / count : 0;

    return {
      critical_issues_open,
      blocker_issues_open,
      critical_avg_resolution_hours: parseFloat(
        critical_avg_resolution_hours.toFixed(2)
      ),
    };
  }

  /**
   * Calculate MR link rate
   */
  private calculateMRLinkRate(withLinks: number, checked: number) {
    const issue_mr_link_rate_percent =
      checked > 0 ? (withLinks / checked) * 100 : 0;

    return {
      issues_with_mr_links: withLinks,
      total_closed_issues_checked: checked,
      issue_mr_link_rate_percent: parseFloat(issue_mr_link_rate_percent.toFixed(2)),
    };
  }

  // ========================================================================
  // ALERT LEVEL CALCULATIONS
  // ========================================================================

  private getVelocityAlertLevel(velocity: number): string {
    // For 30-day velocity, use appropriate thresholds
    if (velocity === 0) return 'RED_ALERT';
    if (velocity < 10) return 'WARNING';
    return 'NORMAL';
  }

  private getCycleTimeAlertLevel(avgDays: number): string {
    if (avgDays > 14) return 'RED_ALERT';
    if (avgDays > 7) return 'WARNING';
    return 'NORMAL';
  }

  private getReopenRateAlertLevel(reopenRate: number): string {
    if (reopenRate > 15) return 'RED_ALERT';
    if (reopenRate > 10) return 'WARNING';
    return 'NORMAL';
  }

  private getBugRatioAlertLevel(bugRatio: number): string {
    if (bugRatio > 50) return 'RED_ALERT';
    if (bugRatio > 30) return 'WARNING';
    return 'NORMAL';
  }

  /**
   * Calculate closure rate as simple ratio (closed/opened)
   */
  private calculateClosureRate(closedLast30d: number, openedLast30d: number): number {
    if (openedLast30d === 0) {
      return 0;
    }
    const rate = closedLast30d / openedLast30d;
    return parseFloat(rate.toFixed(2));
  }

  /**
   * Check if issue was reopened by analyzing state events
   */
  isIssueReopened(stateEvents: GitLabIssueStateEvent[]): boolean {
    if (stateEvents.length === 0) return false;

    // Look for 'reopened' state or multiple 'opened' states
    const hasReopenedState = stateEvents.some((event) => event.state === 'reopened');
    if (hasReopenedState) return true;

    // Check if there are multiple 'opened' states (closed then opened again)
    const openedCount = stateEvents.filter((e) => e.state === 'opened').length;
    return openedCount > 1;
  }
}

export default new IssueMetricsCalculationService();
