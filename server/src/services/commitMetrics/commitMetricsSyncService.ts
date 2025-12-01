// Commit Metrics Sync Service
// Orchestrates data collection, calculation, and storage
// Follows the same pattern as issueMetricsSyncService.ts and mrMetricsSyncService.ts

import gitLabCommitService from '../gitlab/gitLabCommitService';
import commitMetricsCalculationService from './commitMetricsCalculationService';
import commitMetricsDbService from './commitMetricsDbService';
import { CommitHealthMetrics } from '../../types/commitMetrics.types';

class CommitMetricsSyncService {

  /**
   * Main sync function - collects data, calculates metrics, and stores results
   */
  async syncCommitMetrics(projectId: number): Promise<CommitHealthMetrics> {
    console.log(`[CommitMetricsSync] Starting sync for project ${projectId}`);

    try {
      // STEP 1: Fetch all required data from GitLab
      console.log('[CommitMetricsSync] Step 1: Fetching data from GitLab...');
      const data = await this.fetchGitLabData(projectId);
      console.log('[CommitMetricsSync] Step 1 completed - data fetched');

      // STEP 2: Calculate metrics
      console.log('[CommitMetricsSync] Step 2: Calculating metrics...');
      const calculatedMetrics = commitMetricsCalculationService.calculateMetrics(
        projectId,
        data.commitsLast7d,
        data.totalCommitCount
      );

      // STEP 3: Save metrics to database
      console.log('[CommitMetricsSync] Step 3: Saving metrics to database...');
      const savedMetrics = await commitMetricsDbService.saveMetrics(
        projectId,
        calculatedMetrics
      );

      // STEP 4: Save historical snapshot
      console.log('[CommitMetricsSync] Step 4: Saving historical snapshot...');
      await commitMetricsDbService.saveHistoricalSnapshot(projectId);

      console.log(`[CommitMetricsSync] ✅ Sync completed for project ${projectId}`);
      return savedMetrics;

    } catch (error) {
      console.error(`[CommitMetricsSync] ❌ Error syncing project ${projectId}:`, error);
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

    console.log('[CommitMetricsSync] Fetching commits from last 7 days...');

    // Fetch commits from last 7 days (with stats)
    const commitsLast7d = await gitLabCommitService.getCommits(
      projectId,
      sevenDaysAgoISO,
      100
    );

    // Get total commit count using header
    const totalCommitCount = await gitLabCommitService.getCommitCount(
      projectId,
      sevenDaysAgoISO
    );

    console.log(`[CommitMetricsSync] Fetched: ${commitsLast7d.length} commits (${totalCommitCount} total)`);

    return {
      commitsLast7d,
      totalCommitCount,
    };
  }
}

export default new CommitMetricsSyncService();
