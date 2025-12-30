// DORA Metrics Database Service
// Handles all database operations for DORA metrics

import { getPool } from '../../db/connection';
import {
  DeploymentFrequency,
  DeploymentFrequencyInput,
  LeadTimeChange,
  LeadTimeChangeInput,
  ChangeFailureRate,
  ChangeFailureRateInput,
  TimeToRestoreService,
  TimeToRestoreServiceInput,
} from '../../types/doraMetrics.types';

/**
 * Save a deployment frequency record
 */
export const saveDeploymentFrequency = async (
  data: DeploymentFrequencyInput
): Promise<DeploymentFrequency> => {
  const pool = getPool();
  
  const query = `
    INSERT INTO deployment_frequency (
      project_id,
      deployment_id,
      version,
      environment,
      deployment_timestamp
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    data.project_id,
    data.deployment_id,
    data.version || null,
    data.environment,
    data.deployment_timestamp,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Save a lead time change record
 * Automatically calculates lead_time_hours
 */
export const saveLeadTimeChange = async (
  data: LeadTimeChangeInput
): Promise<LeadTimeChange> => {
  const pool = getPool();
  
  // Calculate lead time in hours
  const mergedTime = new Date(data.merged_timestamp);
  const deployedTime = new Date(data.deployed_timestamp);
  const leadTimeHours = (deployedTime.getTime() - mergedTime.getTime()) / (1000 * 60 * 60);

  const query = `
    INSERT INTO lead_time_changes (
      project_id,
      change_id,
      merged_timestamp,
      deployed_timestamp,
      lead_time_hours
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    data.project_id,
    data.change_id,
    data.merged_timestamp,
    data.deployed_timestamp,
    leadTimeHours.toFixed(2),
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Save a change failure rate record
 */
export const saveChangeFailureRate = async (
  data: ChangeFailureRateInput
): Promise<ChangeFailureRate> => {
  const pool = getPool();
  
  const query = `
    INSERT INTO change_failure_rate (
      project_id,
      deployment_id,
      deployment_timestamp,
      has_incident,
      remediation_type
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    data.project_id,
    data.deployment_id,
    data.deployment_timestamp,
    data.has_incident,
    data.remediation_type,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Save a time to restore service record
 * Automatically calculates restore_time_hours
 */
export const saveTimeToRestoreService = async (
  data: TimeToRestoreServiceInput
): Promise<TimeToRestoreService> => {
  const pool = getPool();
  
  // Calculate restore time in hours
  const startTime = new Date(data.start_time);
  const endTime = new Date(data.end_time);
  const restoreTimeHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

  const query = `
    INSERT INTO time_to_restore_service (
      project_id,
      incident_id,
      start_time,
      end_time,
      restore_time_hours,
      description
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const values = [
    data.project_id,
    data.incident_id,
    data.start_time,
    data.end_time,
    restoreTimeHours.toFixed(2),
    data.description || null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Get all deployment frequency records for a project
 */
export const getDeploymentFrequencyByProject = async (
  projectId: number,
  days: number = 30
): Promise<DeploymentFrequency[]> => {
  const pool = getPool();
  
  const query = `
    SELECT * FROM deployment_frequency
    WHERE project_id = $1
      AND deployment_timestamp >= NOW() - INTERVAL '${days} days'
    ORDER BY deployment_timestamp DESC
  `;

  const result = await pool.query(query, [projectId]);
  return result.rows;
};

/**
 * Get all lead time change records for a project
 */
export const getLeadTimeChangesByProject = async (
  projectId: number,
  days: number = 30
): Promise<LeadTimeChange[]> => {
  const pool = getPool();
  
  const query = `
    SELECT * FROM lead_time_changes
    WHERE project_id = $1
      AND merged_timestamp >= NOW() - INTERVAL '${days} days'
    ORDER BY merged_timestamp DESC
  `;

  const result = await pool.query(query, [projectId]);
  return result.rows;
};

/**
 * Get all change failure rate records for a project
 */
export const getChangeFailureRateByProject = async (
  projectId: number,
  days: number = 30
): Promise<ChangeFailureRate[]> => {
  const pool = getPool();
  
  const query = `
    SELECT * FROM change_failure_rate
    WHERE project_id = $1
      AND deployment_timestamp >= NOW() - INTERVAL '${days} days'
    ORDER BY deployment_timestamp DESC
  `;

  const result = await pool.query(query, [projectId]);
  return result.rows;
};

/**
 * Get all time to restore service records for a project
 */
export const getTimeToRestoreServiceByProject = async (
  projectId: number,
  days: number = 30
): Promise<TimeToRestoreService[]> => {
  const pool = getPool();
  
  const query = `
    SELECT * FROM time_to_restore_service
    WHERE project_id = $1
      AND start_time >= NOW() - INTERVAL '${days} days'
    ORDER BY start_time DESC
  `;

  const result = await pool.query(query, [projectId]);
  return result.rows;
};

/**
 * Search deployments by deployment_id (for autocomplete)
 */
export const searchDeploymentsByIdPrefix = async (
  projectId: number,
  searchTerm: string,
  limit: number = 10
): Promise<DeploymentFrequency[]> => {
  const pool = getPool();
  
  const query = `
    SELECT * FROM deployment_frequency
    WHERE project_id = $1
      AND deployment_id ILIKE $2
    ORDER BY deployment_timestamp DESC
    LIMIT $3
  `;

  const result = await pool.query(query, [projectId, `%${searchTerm}%`, limit]);
  return result.rows;
};

/**
 * Delete a deployment frequency record by UUID
 */
export const deleteDeploymentFrequency = async (uuid: string): Promise<boolean> => {
  const pool = getPool();
  const result = await pool.query('DELETE FROM deployment_frequency WHERE uuid = $1', [uuid]);
  return result.rowCount ? result.rowCount > 0 : false;
};

/**
 * Delete a lead time change record by UUID
 */
export const deleteLeadTimeChange = async (uuid: string): Promise<boolean> => {
  const pool = getPool();
  const result = await pool.query('DELETE FROM lead_time_changes WHERE uuid = $1', [uuid]);
  return result.rowCount ? result.rowCount > 0 : false;
};

/**
 * Delete a change failure rate record by UUID
 */
export const deleteChangeFailureRate = async (uuid: string): Promise<boolean> => {
  const pool = getPool();
  const result = await pool.query('DELETE FROM change_failure_rate WHERE uuid = $1', [uuid]);
  return result.rowCount ? result.rowCount > 0 : false;
};

/**
 * Delete a time to restore service record by UUID
 */
export const deleteTimeToRestoreService = async (uuid: string): Promise<boolean> => {
  const pool = getPool();
  const result = await pool.query('DELETE FROM time_to_restore_service WHERE uuid = $1', [uuid]);
  return result.rowCount ? result.rowCount > 0 : false;
};
