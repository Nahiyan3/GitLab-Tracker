-- Migration 016: Allow multiple history snapshots per day
-- Purpose: Remove UNIQUE constraint on (project_id, snapshot_date) to allow multiple refreshes per day
-- Date: 2025-12-14

DO $$
BEGIN
  -- 1. Issue Metrics History - Drop UNIQUE constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'idx_history_project_date'
  ) THEN
    ALTER TABLE issue_metrics_history DROP CONSTRAINT idx_history_project_date;
    RAISE NOTICE 'Dropped UNIQUE constraint from issue_metrics_history';
  END IF;

  -- 2. MR Metrics History - Drop UNIQUE constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'idx_mr_history_project_date'
  ) THEN
    ALTER TABLE mr_metrics_history DROP CONSTRAINT idx_mr_history_project_date;
    RAISE NOTICE 'Dropped UNIQUE constraint from mr_metrics_history';
  END IF;

  -- 3. Commit Metrics History - Drop UNIQUE constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'commit_metrics_history_unique'
  ) THEN
    ALTER TABLE commit_metrics_history DROP CONSTRAINT commit_metrics_history_unique;
    RAISE NOTICE 'Dropped UNIQUE constraint from commit_metrics_history';
  END IF;

  -- 4. SonarQube Reliability History - Drop UNIQUE constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sonar_reliability_history_unique'
  ) THEN
    ALTER TABLE sonarqube_reliability_history DROP CONSTRAINT sonar_reliability_history_unique;
    RAISE NOTICE 'Dropped UNIQUE constraint from sonarqube_reliability_history';
  END IF;

  -- 5. SonarQube Maintainability History - Drop UNIQUE constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sonar_maintainability_history_unique'
  ) THEN
    ALTER TABLE sonarqube_maintainability_history DROP CONSTRAINT sonar_maintainability_history_unique;
    RAISE NOTICE 'Dropped UNIQUE constraint from sonarqube_maintainability_history';
  END IF;

  -- 6. SonarQube Security History - Drop UNIQUE constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sonar_security_history_unique'
  ) THEN
    ALTER TABLE sonarqube_security_history DROP CONSTRAINT sonar_security_history_unique;
    RAISE NOTICE 'Dropped UNIQUE constraint from sonarqube_security_history';
  END IF;

  -- Add timestamp columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='issue_metrics_history' AND column_name='created_at'
  ) THEN
    ALTER TABLE issue_metrics_history ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE 'Added created_at to issue_metrics_history';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='mr_metrics_history' AND column_name='created_at'
  ) THEN
    ALTER TABLE mr_metrics_history ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE 'Added created_at to mr_metrics_history';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='commit_metrics_history' AND column_name='created_at'
  ) THEN
    ALTER TABLE commit_metrics_history ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE 'Added created_at to commit_metrics_history';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='sonarqube_reliability_history' AND column_name='created_at'
  ) THEN
    ALTER TABLE sonarqube_reliability_history ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE 'Added created_at to sonarqube_reliability_history';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='sonarqube_maintainability_history' AND column_name='created_at'
  ) THEN
    ALTER TABLE sonarqube_maintainability_history ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE 'Added created_at to sonarqube_maintainability_history';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='sonarqube_security_history' AND column_name='created_at'
  ) THEN
    ALTER TABLE sonarqube_security_history ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE 'Added created_at to sonarqube_security_history';
  END IF;

  RAISE NOTICE 'Migration 016: Removed UNIQUE constraints to allow multiple snapshots per day';
END $$;
