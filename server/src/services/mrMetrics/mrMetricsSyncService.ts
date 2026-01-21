// MR Metrics Sync Service
// Orchestrates data collection, calculation, and storage
// Follows the same pattern as issueMetricsSyncService.ts

import gitLabMRService from '../gitlab/gitLabMRService';
import mrMetricsCalculationService from './mrMetricsCalculationService';
import mrMetricsDbService from './mrMetricsDbService';
import { MRHealthMetrics } from '../../types/mrMetrics.types';

class MRMetricsSyncService {

  /**
   * Main sync function - collects data, calculates metrics, and stores results
   */
  async syncMRMetrics(projectId: number): Promise<MRHealthMetrics> {
    console.log(`[MRMetricsSync] Starting sync for project ${projectId}`);

    try {
      // STEP 1: Fetch all required data from GitLab
      console.log('[MRMetricsSync] Step 1: Fetching data from GitLab...');
      const data = await this.fetchGitLabData(projectId);
      console.log('[MRMetricsSync] Step 1 completed - data fetched');

      // STEP 2: Calculate metrics
      console.log('[MRMetricsSync] Step 2: Calculating metrics...');
      const calculatedMetrics = mrMetricsCalculationService.calculateMetrics(
        projectId,
        data.openMRs,
        data.mergedMRsLast7d,
        data.mergedMRsLast30d,
        data.allRecentMergedMRs,
        data.openedMRsLast7d,
        data.openedMRsLast30d,
        data.totalOpenCount,
        data.totalMergedCount,
        data.commentsData,
        data.revertData,
        data.reviewersData
      );

      // STEP 3: Save metrics to database
      console.log('[MRMetricsSync] Step 3: Saving metrics to database...');
      const savedMetrics = await mrMetricsDbService.saveMetrics(
        projectId,
        calculatedMetrics
      );

      // STEP 4: Save historical snapshot
      console.log('[MRMetricsSync] Step 4: Saving historical snapshot...');
      await mrMetricsDbService.saveHistoricalSnapshot(projectId);

      console.log(`[MRMetricsSync] ✅ Sync completed for project ${projectId}`);
      return savedMetrics;

    } catch (error) {
      console.error(`[MRMetricsSync] ❌ Error syncing project ${projectId}:`, error);
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

    console.log('[MRMetricsSync] Fetching basic counts...');

    // Get counts (fast, using headers)
    const totalMergedCount = await gitLabMRService.getMRCount(projectId, 'merged');
    const totalOpenCount = await gitLabMRService.getMRCount(projectId, 'opened');

    console.log(`[MRMetricsSync] Total MRs: ${totalOpenCount} open, ${totalMergedCount} merged`);

    // Store the actual counts for use in metrics
    const actualTotalOpenCount = totalOpenCount;
    const actualTotalMergedCount = totalMergedCount;

    // Fetch data in parallel batches for performance
    console.log('[MRMetricsSync] Fetching MR data...');

    const [
      openMRs,
      mergedMRsLast7d,
      mergedMRsLast30d,
      allRecentMergedMRs,
      openedMRsLast7d,
      openedMRsLast30d,
    ] = await Promise.all([
      // Open MRs sorted by last updated (for stale detection)
      gitLabMRService.getOpenMRs(projectId, 500),

      // Merged MRs in last 7 days
      gitLabMRService.getMergedMRs(projectId, sevenDaysAgoISO, 500),

      // Merged MRs in last 30 days
      gitLabMRService.getMergedMRs(projectId, thirtyDaysAgoISO, 500),

      // All recent merged MRs (no date filter) for merge time calculation
      gitLabMRService.getMergedMRs(projectId, undefined, 500),

      // Opened in last 7 days
      gitLabMRService.getOpenedMRs(projectId, sevenDaysAgoISO, 500),

      // Opened in last 30 days
      gitLabMRService.getOpenedMRs(projectId, thirtyDaysAgoISO, 500),
    ]);

    console.log(`[MRMetricsSync] Fetched: ${openMRs.length} open, ${mergedMRsLast7d.length} merged(7d), ${mergedMRsLast30d.length} merged(30d)`);
    
    console.log('[MRMetricsSync] Calculating review comments (sampling)...');

    // Calculate average review comments (sample 50 merged MRs from last 30 days)
    const commentsData = await this.calculateReviewComments(projectId, mergedMRsLast30d.slice(0, 50));

    console.log('[MRMetricsSync] Checking for reverted MRs (sampling)...');

    // Check for reverted MRs (sample 50 merged MRs from last 30 days) - use data already fetched
    const revertData = this.calculateRevertRateFromData(mergedMRsLast30d.slice(0, 50));

    console.log('[MRMetricsSync] Calculating average reviewers (sampling)...');

    // Calculate average reviewers per MR (sample 50 MRs from last 30 days) - use data already fetched
    const reviewersData = this.calculateAvgReviewersFromData(mergedMRsLast30d.slice(0, 50));

    return {
      openMRs,
      mergedMRsLast7d,
      mergedMRsLast30d,
      allRecentMergedMRs,
      openedMRsLast7d,
      openedMRsLast30d,
      totalOpenCount: actualTotalOpenCount,
      totalMergedCount: actualTotalMergedCount,
      commentsData,
      revertData,
      reviewersData,
    };
  }

  /**
   * Calculate review comments from a sample of merged MRs
   */
  private async calculateReviewComments(projectId: number, mergedMRsSample: any[]) {
    let totalComments = 0;
    const checkedCount = mergedMRsSample.length;

    // Check each MR for review comments (with delay to avoid rate limiting)
    for (const mr of mergedMRsSample) {
      try {
        const notes = await gitLabMRService.getMRNotes(projectId, mr.iid);
        
        // Count non-system notes (actual review comments)
        const reviewComments = notes.filter((note: any) => !note.system);
        totalComments += reviewComments.length;
        
        // Add 100ms delay between calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[MRMetricsSync] Error fetching notes for MR ${mr.iid}:`, error);
        // Continue with other MRs
      }
    }

    return {
      totalComments,
      checked: checkedCount,
    };
  }

  /**
   * Check for reverted MRs from a sample (using already fetched data)
   */
  private calculateRevertRateFromData(mergedMRsSample: any[]) {
    let revertedCount = 0; 
    const checkedCount = mergedMRsSample.length;

    // Check each MR if it was reverted (using data we already have)
    for (const mr of mergedMRsSample) {
      // Check if title contai 
      const hasRevertInTitle = mr.title?.toLowerCase().includes('revert') || false;
      const hasRevertInDescription = mr.description?.toLowerCase().includes('revert') || false;
      
      // Check labels
      const hasRevertLabel = mr.labels?.some((label: string) => 
        label.toLowerCase().includes('revert')
      ) || false;

      if (hasRevertInTitle || hasRevertInDescription || hasRevertLabel) {
        revertedCount++;
      }
    }

    return {
      reverted: revertedCount,
      checked: checkedCount,
    };
  }

  /**
   * Calculate average reviewers per MR from a sample (using already fetched data)
   */
  private calculateAvgReviewersFromData(mergedMRsSample: any[]) {
    let totalReviewers = 0;
    const checkedCount = mergedMRsSample.length;

    // Check each MR for reviewers (using data we already have)
    for (const mr of mergedMRsSample) {
      // Get reviewers count from the data we already fetched
      const reviewersCount = mr.reviewers?.length || 0;
      totalReviewers += reviewersCount;
    }

    return {
      totalReviewers,
      checked: checkedCount,
    };
  }
}

export default new MRMetricsSyncService();
