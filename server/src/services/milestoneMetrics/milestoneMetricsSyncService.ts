// Milestone Metrics Sync Service
// Orchestrates fetching milestones and calculating metrics

import gitlabMilestoneService from '../gitlab/gitlabMilestoneService';
import gitlabClient from '../gitlab/gitlabClient';
import milestoneMetricsCalculationService from './milestoneMetricsCalculationService';
import milestoneMetricsDbService from './milestoneMetricsDbService';
import { MilestoneMetrics } from '../../types/milestoneMetrics.types';

interface GitLabMilestone {
  id: number;
  iid: number;
  title: string;
  state: string;
  due_date: string | null;
  issue_stats?: {
    opened: number;
    closed: number;
  };
}

class MilestoneMetricsSyncService {
  /**
   * Main sync function - fetches active milestones and calculates metrics
   */
  async syncMilestoneMetrics(projectId: number): Promise<MilestoneMetrics> {
    console.log(`[MilestoneMetricsSync] Starting sync for project ${projectId}`);

    try {
      // STEP 1: Fetch active, non-expired milestones
      console.log('[MilestoneMetricsSync] Step 1: Fetching active milestones...');
      const activeMilestones = await gitlabMilestoneService.getProjectMilestones(projectId);
      console.log(
        `[MilestoneMetricsSync] Found ${activeMilestones.length} active, non-expired milestones`
      );

      if (activeMilestones.length === 0) {
        const emptyMetrics: MilestoneMetrics = {
          max_issues: 0,
          min_issues: 0,
          avg_issues: 0,
          total_milestones: 0,
          milestone_with_max_issues: null,
          milestone_with_min_issues: null,
        };

        // Save empty metrics
        await milestoneMetricsDbService.saveMetrics(projectId, emptyMetrics);
        
        return emptyMetrics;
      }

      // STEP 2: Fetch issue counts for each milestone
      console.log('[MilestoneMetricsSync] Step 2: Fetching issue counts for milestones...');
      const milestonesWithCounts = await this.fetchIssueCounts(projectId, activeMilestones);

      // STEP 3: Calculate metrics
      console.log('[MilestoneMetricsSync] Step 3: Calculating metrics...');
      const calculatedMetrics =
        milestoneMetricsCalculationService.calculateMetrics(milestonesWithCounts);

      // STEP 4: Save to database
      console.log('[MilestoneMetricsSync] Step 4: Saving metrics to database...');
      await milestoneMetricsDbService.saveMetrics(projectId, calculatedMetrics);

      console.log(`[MilestoneMetricsSync] ✅ Sync completed for project ${projectId}`);
      return calculatedMetrics;
    } catch (error) {
      console.error(`[MilestoneMetricsSync] ❌ Error syncing project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch issue counts for milestones
   */
  private async fetchIssueCounts(projectId: number, milestones: any[]) {
    const client = gitlabClient.getClient();

    const milestonesWithCounts = await Promise.all(
      milestones.map(async (milestone) => {
        try {
          // Fetch actual issues from the milestone to get accurate count
          // Use pagination to get all issues
          let allIssues: any[] = [];
          let page = 1;
          let hasMore = true;

          while (hasMore) {
            const response = await client.get(
              `/projects/${projectId}/milestones/${milestone.id}/issues`,
              {
                params: {
                  per_page: 100,
                  page: page,
                },
              }
            );

            const issues = response.data;
            allIssues = allIssues.concat(issues);

            // Check if there are more pages
            hasMore = issues.length === 100;
            page++;
          }

          console.log(
            `[MilestoneMetricsSync] Milestone "${milestone.title}" (ID: ${milestone.id}) has ${allIssues.length} issues`
          );

          return {
            id: milestone.id,
            title: milestone.title,
            issue_count: allIssues.length,
            due_date: milestone.due_date,
          };
        } catch (error) {
          console.error(
            `[MilestoneMetricsSync] Error fetching issue count for milestone ${milestone.id}:`,
            error
          );
          return {
            id: milestone.id,
            title: milestone.title,
            issue_count: 0,
            due_date: milestone.due_date,
          };
        }
      })
    );

    return milestonesWithCounts;
  }
}

export default new MilestoneMetricsSyncService();
