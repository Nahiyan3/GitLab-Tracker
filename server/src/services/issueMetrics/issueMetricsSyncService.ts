// Issue Metrics Sync Service
// Orchestrates data collection, calculation, and storage

import gitLabIssueService from '../gitlab/gitLabIssueService';
import issueMetricsCalculationService from './issueMetricsCalculationService';
import issueMetricsDbService from './issueMetricsDbService';
import { IssueHealthMetrics } from '../../types/issueMetrics.types';

class IssueMetricsSyncService {

  /**
   * Main sync function - collects data, calculates metrics, and stores results
   */
  async syncIssueMetrics(projectId: number): Promise<IssueHealthMetrics> {
    console.log(`[IssueMetricsSync] Starting sync for project ${projectId}`);

    try {
      // STEP 1: Fetch all required data from GitLab
      console.log('[IssueMetricsSync] Step 1: Fetching data from GitLab...');
      const data = await this.fetchGitLabData(projectId);
      console.log('[IssueMetricsSync] Step 1 completed - data fetched');

      // STEP 2: Calculate metrics
      console.log('[IssueMetricsSync] Step 2: Calculating metrics...');
      const calculatedMetrics = issueMetricsCalculationService.calculateMetrics(
        projectId,
        data.openIssues,
        data.closedIssuesLast7d,
        data.closedIssuesLast30d, // Correct: closed issues in last 30 days
        data.openedIssuesLast7d,
        data.openedIssuesLast30d,
        data.bugIssues,
        data.featureIssues,
        data.criticalIssues,
        data.blockerIssues,
        data.totalOpenCount,
        data.totalClosedCount,
        data.reopenData,
        data.mrLinkData
      );

      // STEP 3: Save metrics to database
      console.log('[IssueMetricsSync] Step 3: Saving metrics to database...');
      const savedMetrics = await issueMetricsDbService.saveMetrics(
        projectId,
        calculatedMetrics
      );

      // STEP 4: Save historical snapshot
      console.log('[IssueMetricsSync] Step 4: Saving historical snapshot...');
      await issueMetricsDbService.saveHistoricalSnapshot(projectId);

      console.log(`[IssueMetricsSync] ✅ Sync completed for project ${projectId}`);
      return savedMetrics;

    } catch (error) {
      console.error(`[IssueMetricsSync] ❌ Error syncing project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch all required data from GitLab API
   */
  private async fetchGitLabData(projectId: number) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    console.log('[IssueMetricsSync] Fetching basic counts...');

    // Get counts (fast, using headers)
    const totalClosedCount = await gitLabIssueService.getIssueCount(projectId, 'closed');
    const totalOpenCount = await gitLabIssueService.getIssueCount(projectId, 'opened');

    console.log(`[IssueMetricsSync] Total issues: ${totalOpenCount} open, ${totalClosedCount} closed`);

    // Store the actual counts for use in metrics
    const actualTotalOpenCount = totalOpenCount;
    const actualTotalClosedCount = totalClosedCount;
    
    console.log(`[IssueMetricsSync] DEBUG - Header says ${totalClosedCount} total closed`);

    // Fetch data in parallel batches for performance
    console.log('[IssueMetricsSync] Fetching issue data...');

    const [
      openIssues,
      closedIssuesLast7d,
      closedIssuesLast30d,
      allRecentClosedIssues,
      openedIssuesLast7d,
      openedIssuesLast30d,
      bugIssues,
      featureIssues,
      criticalIssues,
      blockerIssues,
    ] = await Promise.all([
      // Open issues sorted by last updated (for stale detection)
      gitLabIssueService.getOpenIssues(projectId, 10000),

      // Closed issues in last 7 days (velocity)
      gitLabIssueService.getClosedIssues(projectId, sevenDaysAgoISO, 10000),

      // Closed issues in last 30 days (for recent velocity)
      gitLabIssueService.getClosedIssues(projectId, thirtyDaysAgoISO, 10000),

      // All recent closed issues (no date filter) for cycle time calculation
      gitLabIssueService.getClosedIssues(projectId, undefined, 10000),

      // Opened in last 7 days
      gitLabIssueService.getOpenedIssues(projectId, sevenDaysAgoISO, 10000),

      // Opened in last 30 days
      gitLabIssueService.getOpenedIssues(projectId, thirtyDaysAgoISO, 10000),

      // Bug issues (last 90 days for ratio calculation)
      gitLabIssueService.getIssuesByLabel(projectId, ['bug'], undefined, 'all'),

      // Feature issues (last 90 days for ratio calculation)
      gitLabIssueService.getIssuesByLabel(projectId, ['feature'], undefined, 'all'),

      // Critical priority issues
      gitLabIssueService.getIssuesByLabel(projectId, ['priority::critical'], undefined, 'opened'),

      // Blocker priority issues
      gitLabIssueService.getIssuesByLabel(projectId, ['priority::blocker'], undefined, 'opened'),
    ]);

    console.log(`[IssueMetricsSync] Fetched: ${openIssues.length} open, ${closedIssuesLast7d.length} closed(7d), ${closedIssuesLast30d.length} closed(30d), ${allRecentClosedIssues.length} total recent closed`);
    console.log(`[IssueMetricsSync] DEBUG - closedIssuesLast30d.length = ${closedIssuesLast30d.length}`);
    console.log(`[IssueMetricsSync] Bugs: ${bugIssues.length}, Features: ${featureIssues.length}, Critical: ${criticalIssues.length}`);
    
    // Debug: Log sample closed issues
    if (closedIssuesLast7d.length > 0) {
      console.log(`[IssueMetricsSync] Sample closed issue (7d):`, {
        id: closedIssuesLast7d[0].id,
        title: closedIssuesLast7d[0].title?.substring(0, 50),
        closed_at: closedIssuesLast7d[0].closed_at,
        created_at: closedIssuesLast7d[0].created_at
      });
    } else {
      console.log(`[IssueMetricsSync] ⚠️ No closed issues found in last 7 days!`);
    }
    
    if (allRecentClosedIssues.length > 0) {
      console.log(`[IssueMetricsSync] Sample recent closed issue:`, {
        id: allRecentClosedIssues[0].id,
        title: allRecentClosedIssues[0].title?.substring(0, 50),
        closed_at: allRecentClosedIssues[0].closed_at,
        created_at: allRecentClosedIssues[0].created_at
      });
    }

    console.log('[IssueMetricsSync] Calculating reopen rate (sampling)...');

    // Calculate reopen rate (sample 50 closed issues to avoid too many API calls)
    const reopenData = await this.calculateReopenRate(projectId, allRecentClosedIssues.slice(0, 50));

    console.log('[IssueMetricsSync] Calculating MR link rate (sampling)...');

    // Calculate MR link rate (sample 30 closed issues)
    const mrLinkData = await this.calculateMRLinkRate(projectId, allRecentClosedIssues.slice(0, 30));

    return {
      openIssues,
      closedIssuesLast7d,
      closedIssuesLast30d,
      allRecentClosedIssues,
      openedIssuesLast7d,
      openedIssuesLast30d,
      bugIssues,
      featureIssues,
      criticalIssues,
      blockerIssues,
      totalOpenCount: actualTotalOpenCount,
      totalClosedCount: actualTotalClosedCount,
      reopenData,
      mrLinkData,
    };
  }

  /**
   * Calculate reopen rate from a sample of closed issues
   */
  private async calculateReopenRate(projectId: number, closedIssuesSample: any[]) {
    let reopenedCount = 0;
    const checkedCount = closedIssuesSample.length;

    // Check each issue for reopen events (limit to avoid too many API calls)
    for (const issue of closedIssuesSample) {
      try {
        const stateEvents = await gitLabIssueService.getIssueStateEvents(
          projectId,
          issue.iid
        );

        if (issueMetricsCalculationService.isIssueReopened(stateEvents)) {
          reopenedCount++;
        }
        
        // Add 100ms delay between calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[IssueMetricsSync] Error checking reopen for issue ${issue.iid}:`, error);
        // Continue with other issues
      }
    }

    return {
      reopened: reopenedCount,
      checked: checkedCount,
    };
  }

  /**
   * Calculate MR link rate from a sample of closed issues
   */
  private async calculateMRLinkRate(projectId: number, closedIssuesSample: any[]) {
    let withLinksCount = 0;
    const checkedCount = closedIssuesSample.length;

    // Check each issue for MR links
    for (const issue of closedIssuesSample) {
      try {
        // Check if closed by MR
        const closedByMRs = await gitLabIssueService.getIssueClosedBy(
          projectId,
          issue.iid
        );

        // Also check issue links
        const issueLinks = await gitLabIssueService.getIssueLinks(projectId, issue.iid);

        if (closedByMRs.length > 0 || issueLinks.length > 0) {
          withLinksCount++;
        }
        
        // Add 100ms delay between calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[IssueMetricsSync] Error checking MR links for issue ${issue.iid}:`, error);
        // Continue with other issues
      }
    }

    return {
      withLinks: withLinksCount,
      checked: checkedCount,
    };
  }
}

export default new IssueMetricsSyncService();
