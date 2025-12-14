// Health Score Calculator
// Calculates 0-5 health scores for all 6 metric types

/**
 * Calculate Issue Metrics Health Score (0-5)
 */
export function calculateIssueHealthScore(metrics: {
  avg_cycle_time_days: number;
  reopen_rate_percent: number;
  issues_closed_last_7d: number;
  critical_issues_open: number;
}): number {
  // Cycle Time Score (30%)
  let cycleTimeScore = 0;
  if (metrics.avg_cycle_time_days < 1) cycleTimeScore = 5;
  else if (metrics.avg_cycle_time_days < 3) cycleTimeScore = 4;
  else if (metrics.avg_cycle_time_days < 7) cycleTimeScore = 3;
  else if (metrics.avg_cycle_time_days < 14) cycleTimeScore = 2;
  else if (metrics.avg_cycle_time_days < 30) cycleTimeScore = 1;
  else cycleTimeScore = 0;

  // Reopen Rate Score (25%)
  let reopenRateScore = 0;
  if (metrics.reopen_rate_percent < 5) reopenRateScore = 5;
  else if (metrics.reopen_rate_percent < 10) reopenRateScore = 4;
  else if (metrics.reopen_rate_percent < 20) reopenRateScore = 3;
  else if (metrics.reopen_rate_percent < 30) reopenRateScore = 2;
  else if (metrics.reopen_rate_percent < 50) reopenRateScore = 1;
  else reopenRateScore = 0;

  // Velocity Score (25%)
  let velocityScore = 0;
  if (metrics.issues_closed_last_7d > 20) velocityScore = 5;
  else if (metrics.issues_closed_last_7d >= 10) velocityScore = 4;
  else if (metrics.issues_closed_last_7d >= 5) velocityScore = 3;
  else if (metrics.issues_closed_last_7d >= 2) velocityScore = 2;
  else if (metrics.issues_closed_last_7d >= 1) velocityScore = 1;
  else velocityScore = 0;

  // Critical Issues Score (20%)
  let criticalScore = 0;
  if (metrics.critical_issues_open === 0) criticalScore = 5;
  else if (metrics.critical_issues_open <= 2) criticalScore = 4;
  else if (metrics.critical_issues_open <= 5) criticalScore = 3;
  else if (metrics.critical_issues_open <= 10) criticalScore = 2;
  else if (metrics.critical_issues_open <= 20) criticalScore = 1;
  else criticalScore = 0;

  const healthScore = 
    cycleTimeScore * 0.30 +
    reopenRateScore * 0.25 +
    velocityScore * 0.25 +
    criticalScore * 0.20;

  return Math.round(healthScore * 10) / 10;
}

/**
 * Calculate MR Metrics Health Score (0-5)
 */
export function calculateMRHealthScore(metrics: {
  avg_merge_time_days: number;
  revert_rate_percent: number;
  mrs_merged_last_7d: number;
  avg_review_comments_per_mr: number;
}): number {
  // Merge Time Score (35%)
  let mergeTimeScore = 0;
  if (metrics.avg_merge_time_days < 1) mergeTimeScore = 5;
  else if (metrics.avg_merge_time_days < 2) mergeTimeScore = 4;
  else if (metrics.avg_merge_time_days < 5) mergeTimeScore = 3;
  else if (metrics.avg_merge_time_days < 10) mergeTimeScore = 2;
  else if (metrics.avg_merge_time_days < 20) mergeTimeScore = 1;
  else mergeTimeScore = 0;

  // Revert Rate Score (25%)
  let revertRateScore = 0;
  if (metrics.revert_rate_percent < 3) revertRateScore = 5;
  else if (metrics.revert_rate_percent < 5) revertRateScore = 4;
  else if (metrics.revert_rate_percent < 10) revertRateScore = 3;
  else if (metrics.revert_rate_percent < 20) revertRateScore = 2;
  else if (metrics.revert_rate_percent < 30) revertRateScore = 1;
  else revertRateScore = 0;

  // MR Velocity Score (25%)
  let velocityScore = 0;
  if (metrics.mrs_merged_last_7d > 15) velocityScore = 5;
  else if (metrics.mrs_merged_last_7d >= 8) velocityScore = 4;
  else if (metrics.mrs_merged_last_7d >= 4) velocityScore = 3;
  else if (metrics.mrs_merged_last_7d >= 2) velocityScore = 2;
  else if (metrics.mrs_merged_last_7d >= 1) velocityScore = 1;
  else velocityScore = 0;

  // Review Engagement Score (15%)
  let reviewScore = 0;
  if (metrics.avg_review_comments_per_mr > 10) reviewScore = 5;
  else if (metrics.avg_review_comments_per_mr >= 5) reviewScore = 4;
  else if (metrics.avg_review_comments_per_mr >= 3) reviewScore = 3;
  else if (metrics.avg_review_comments_per_mr >= 1) reviewScore = 2;
  else if (metrics.avg_review_comments_per_mr > 0) reviewScore = 1;
  else reviewScore = 0;

  const healthScore = 
    mergeTimeScore * 0.35 +
    revertRateScore * 0.25 +
    velocityScore * 0.25 +
    reviewScore * 0.15;

  return Math.round(healthScore * 10) / 10;
}

/**
 * Calculate Commit Metrics Health Score (0-5)
 */
export function calculateCommitHealthScore(metrics: {
  total_commits_last_7d: number;
  avg_commit_size: number;
  bus_factor: number;
}): number {
  // Commit Frequency Score (40%)
  let commitFreqScore = 0;
  if (metrics.total_commits_last_7d > 50) commitFreqScore = 5;
  else if (metrics.total_commits_last_7d >= 25) commitFreqScore = 4;
  else if (metrics.total_commits_last_7d >= 10) commitFreqScore = 3;
  else if (metrics.total_commits_last_7d >= 5) commitFreqScore = 2;
  else if (metrics.total_commits_last_7d >= 1) commitFreqScore = 1;
  else commitFreqScore = 0;

  // Commit Size Score (30%)
  let commitSizeScore = 0;
  if (metrics.avg_commit_size < 100) commitSizeScore = 5;
  else if (metrics.avg_commit_size < 300) commitSizeScore = 4;
  else if (metrics.avg_commit_size < 500) commitSizeScore = 3;
  else if (metrics.avg_commit_size < 1000) commitSizeScore = 2;
  else if (metrics.avg_commit_size < 2000) commitSizeScore = 1;
  else commitSizeScore = 0;

  // Bus Factor Score (30%)
  let busFactorScore = 0;
  if (metrics.bus_factor >= 5) busFactorScore = 5;
  else if (metrics.bus_factor >= 4) busFactorScore = 4;
  else if (metrics.bus_factor >= 3) busFactorScore = 3;
  else if (metrics.bus_factor === 2) busFactorScore = 2;
  else if (metrics.bus_factor === 1) busFactorScore = 1;
  else busFactorScore = 0;

  const healthScore = 
    commitFreqScore * 0.40 +
    commitSizeScore * 0.30 +
    busFactorScore * 0.30;

  return Math.round(healthScore * 10) / 10;
}

/**
 * Calculate SonarQube Reliability Health Score (0-5)
 */
export function calculateReliabilityHealthScore(metrics: {
  reliability_rating: string;
  bugs_total: number;
}): number {
  // Rating Score (50%)
  let ratingScore = 0;
  if (metrics.reliability_rating === 'A') ratingScore = 5;
  else if (metrics.reliability_rating === 'B') ratingScore = 4;
  else if (metrics.reliability_rating === 'C') ratingScore = 3;
  else if (metrics.reliability_rating === 'D') ratingScore = 2;
  else if (metrics.reliability_rating === 'E') ratingScore = 1;
  else ratingScore = 0;

  // Bug Count Score (50%)
  let bugsScore = 0;
  if (metrics.bugs_total === 0) bugsScore = 5;
  else if (metrics.bugs_total <= 5) bugsScore = 4;
  else if (metrics.bugs_total <= 15) bugsScore = 3;
  else if (metrics.bugs_total <= 30) bugsScore = 2;
  else if (metrics.bugs_total <= 50) bugsScore = 1;
  else bugsScore = 0;

  const healthScore = 
    ratingScore * 0.50 +
    bugsScore * 0.50;

  return Math.round(healthScore * 10) / 10;
}

/**
 * Calculate SonarQube Maintainability Health Score (0-5)
 */
export function calculateMaintainabilityHealthScore(metrics: {
  maintainability_rating: string;
  technical_debt_ratio: number;
  code_smells_total: number;
  duplicated_code_percentage: number;
}): number {
  // Rating Score (30%)
  let ratingScore = 0;
  if (metrics.maintainability_rating === 'A') ratingScore = 5;
  else if (metrics.maintainability_rating === 'B') ratingScore = 4;
  else if (metrics.maintainability_rating === 'C') ratingScore = 3;
  else if (metrics.maintainability_rating === 'D') ratingScore = 2;
  else if (metrics.maintainability_rating === 'E') ratingScore = 1;
  else ratingScore = 0;

  // Technical Debt Ratio Score (30%)
  let debtScore = 0;
  if (metrics.technical_debt_ratio < 5) debtScore = 5;
  else if (metrics.technical_debt_ratio < 10) debtScore = 4;
  else if (metrics.technical_debt_ratio < 20) debtScore = 3;
  else if (metrics.technical_debt_ratio < 30) debtScore = 2;
  else if (metrics.technical_debt_ratio < 50) debtScore = 1;
  else debtScore = 0;

  // Code Smells Score (20%)
  let smellsScore = 0;
  if (metrics.code_smells_total === 0) smellsScore = 5;
  else if (metrics.code_smells_total <= 10) smellsScore = 4;
  else if (metrics.code_smells_total <= 30) smellsScore = 3;
  else if (metrics.code_smells_total <= 50) smellsScore = 2;
  else if (metrics.code_smells_total <= 100) smellsScore = 1;
  else smellsScore = 0;

  // Duplicated Code Score (20%)
  let duplicationScore = 0;
  if (metrics.duplicated_code_percentage < 3) duplicationScore = 5;
  else if (metrics.duplicated_code_percentage < 5) duplicationScore = 4;
  else if (metrics.duplicated_code_percentage < 10) duplicationScore = 3;
  else if (metrics.duplicated_code_percentage < 20) duplicationScore = 2;
  else if (metrics.duplicated_code_percentage < 30) duplicationScore = 1;
  else duplicationScore = 0;

  const healthScore = 
    ratingScore * 0.30 +
    debtScore * 0.30 +
    smellsScore * 0.20 +
    duplicationScore * 0.20;

  return Math.round(healthScore * 10) / 10;
}

/**
 * Calculate SonarQube Security Health Score (0-5)
 */
export function calculateSecurityHealthScore(metrics: {
  security_rating: string;
  vulnerabilities_total: number;
  security_hotspots_total: number;
}): number {
  // Security Rating Score (50%)
  let ratingScore = 0;
  if (metrics.security_rating === 'A') ratingScore = 5;
  else if (metrics.security_rating === 'B') ratingScore = 4;
  else if (metrics.security_rating === 'C') ratingScore = 3;
  else if (metrics.security_rating === 'D') ratingScore = 2;
  else if (metrics.security_rating === 'E') ratingScore = 1;
  else ratingScore = 0;

  // Vulnerabilities Score (30%)
  let vulnsScore = 0;
  if (metrics.vulnerabilities_total === 0) vulnsScore = 5;
  else if (metrics.vulnerabilities_total <= 3) vulnsScore = 4;
  else if (metrics.vulnerabilities_total <= 10) vulnsScore = 3;
  else if (metrics.vulnerabilities_total <= 20) vulnsScore = 2;
  else if (metrics.vulnerabilities_total <= 40) vulnsScore = 1;
  else vulnsScore = 0;

  // Security Hotspots Score (20%)
  let hotspotsScore = 0;
  if (metrics.security_hotspots_total === 0) hotspotsScore = 5;
  else if (metrics.security_hotspots_total <= 5) hotspotsScore = 4;
  else if (metrics.security_hotspots_total <= 15) hotspotsScore = 3;
  else if (metrics.security_hotspots_total <= 30) hotspotsScore = 2;
  else if (metrics.security_hotspots_total <= 50) hotspotsScore = 1;
  else hotspotsScore = 0;

  const healthScore = 
    ratingScore * 0.50 +
    vulnsScore * 0.30 +
    hotspotsScore * 0.20;

  return Math.round(healthScore * 10) / 10;
}
