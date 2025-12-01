// Commit Metrics Calculation Service
// Business logic for calculating all commit health metrics

import { GitLabCommit } from '../../types/gitlab.types';
import { CommitMetricsCalculationResult, ContributorCommitData } from '../../types/commitMetrics.types';

class CommitMetricsCalculationService {

  /**
   * Main calculation function - compute all commit metrics
   */
  calculateMetrics(
    projectId: number,
    commitsLast7d: GitLabCommit[],
    totalCommitCount: number
  ): CommitMetricsCalculationResult {
    
    console.log(`[CommitMetrics] Calculating metrics for project ${projectId}`);
    console.log(`[CommitMetrics] Analyzing ${commitsLast7d.length} commits from last 7 days`);

    // Metric 1: Average Commit Size
    const commitSizeResult = this.calculateAvgCommitSize(commitsLast7d);

    // Metric 2: Lines Added vs Deleted
    const linesResult = this.calculateLinesAddedDeleted(commitsLast7d);

    // Metric 3: Commits Per Week
    const commits_per_week = commitsLast7d.length;

    // Metric 4: Bus Factor
    const busFactorResult = this.calculateBusFactor(commitsLast7d);

    // Extract commit details (limit to 100 for storage)
    const commit_details = commitsLast7d.slice(0, 100).map((commit: any) => ({
      sha: commit.id || commit.sha || '',
      title: commit.title || '',
      message: commit.message || '',
      author: commit.author_name || commit.author_email || '',
      created_at: commit.created_at || commit.committed_date || '',
    }));

    return {
      total_commits_last_7d: totalCommitCount,
      total_lines_changed: commitSizeResult.total_lines_changed,
      commits_analyzed: commitSizeResult.commits_analyzed,
      avg_commit_size: commitSizeResult.avg_commit_size,
      total_lines_added: linesResult.total_lines_added,
      total_lines_deleted: linesResult.total_lines_deleted,
      lines_added_deleted_ratio: linesResult.lines_added_deleted_ratio,
      commits_per_week,
      total_contributors: busFactorResult.total_contributors,
      contributors_above_50_percent: busFactorResult.contributors_above_50_percent,
      bus_factor: busFactorResult.bus_factor,
      commit_details,
    };
  }

  /**
   * Calculate average commit size (additions + deletions)
   */
  private calculateAvgCommitSize(commits: GitLabCommit[]) {
    let total_lines_changed = 0;
    let commits_analyzed = 0;

    commits.forEach((commit: any) => {
      if (commit.stats) {
        const additions = commit.stats.additions || 0;
        const deletions = commit.stats.deletions || 0;
        total_lines_changed += (additions + deletions);
        commits_analyzed++;
      }
    });

    const avg_commit_size = commits_analyzed > 0 
      ? total_lines_changed / commits_analyzed 
      : 0;

    console.log(`[CommitMetrics] Avg commit size: ${avg_commit_size.toFixed(2)} lines`);

    return {
      total_lines_changed,
      commits_analyzed,
      avg_commit_size: parseFloat(avg_commit_size.toFixed(2)),
    };
  }

  /**
   * Calculate total lines added and deleted, and their ratio
   */
  private calculateLinesAddedDeleted(commits: GitLabCommit[]) {
    let total_lines_added = 0;
    let total_lines_deleted = 0;

    commits.forEach((commit: any) => {
      if (commit.stats) {
        total_lines_added += commit.stats.additions || 0;
        total_lines_deleted += commit.stats.deletions || 0;
      }
    });

    const lines_added_deleted_ratio = total_lines_deleted > 0
      ? total_lines_added / total_lines_deleted
      : 0;

    console.log(`[CommitMetrics] Lines: +${total_lines_added} -${total_lines_deleted} (ratio: ${lines_added_deleted_ratio.toFixed(2)})`);

    return {
      total_lines_added,
      total_lines_deleted,
      lines_added_deleted_ratio: parseFloat(lines_added_deleted_ratio.toFixed(2)),
    };
  }

  /**
   * Calculate bus factor (number of contributors with >50% of commits)
   */
  private calculateBusFactor(commits: GitLabCommit[]) {
    // Group commits by contributor
    const contributorMap = new Map<string, ContributorCommitData>();

    commits.forEach((commit) => {
      const email = commit.author_email || 'unknown';
      const name = commit.author_name || 'Unknown';
      
      if (contributorMap.has(email)) {
        contributorMap.get(email)!.commit_count++;
      } else {
        contributorMap.set(email, {
          author_email: email,
          author_name: name,
          commit_count: 1,
        });
      }
    });

    const contributors = Array.from(contributorMap.values());
    const total_contributors = contributors.length;
    const totalCommits = commits.length;

    if (totalCommits === 0 || total_contributors === 0) {
      return {
        total_contributors: 0,
        contributors_above_50_percent: 0,
        bus_factor: 0,
      };
    }

    // Count contributors who have more than 50% of commits
    const threshold = totalCommits * 0.5;
    const contributors_above_50_percent = contributors.filter(
      c => c.commit_count > threshold
    ).length;

    // Bus factor is the number of contributors above 50%
    const bus_factor = contributors_above_50_percent;

    console.log(`[CommitMetrics] Bus factor: ${bus_factor} (${total_contributors} contributors, threshold: ${threshold.toFixed(1)} commits)`);

    return {
      total_contributors,
      contributors_above_50_percent,
      bus_factor,
    };
  }
}

export default new CommitMetricsCalculationService();
