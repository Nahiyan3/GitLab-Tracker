-- Migration 015: Add health_score column to all 6 history tables
-- Purpose: Store calculated health scores (0-5) for each metric snapshot
-- Date: 2025-12-14

DO $$
BEGIN
  -- 1. Issue Metrics History
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='issue_metrics_history' AND column_name='health_score'
  ) THEN
    ALTER TABLE issue_metrics_history 
    ADD COLUMN health_score DECIMAL(3,2) DEFAULT NULL;
    RAISE NOTICE 'Added health_score to issue_metrics_history';
  END IF;

  -- 2. MR Metrics History
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='mr_metrics_history' AND column_name='health_score'
  ) THEN
    ALTER TABLE mr_metrics_history 
    ADD COLUMN health_score DECIMAL(3,2) DEFAULT NULL;
    RAISE NOTICE 'Added health_score to mr_metrics_history';
  END IF;

  -- 3. Commit Metrics History
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='commit_metrics_history' AND column_name='health_score'
  ) THEN
    ALTER TABLE commit_metrics_history 
    ADD COLUMN health_score DECIMAL(3,2) DEFAULT NULL;
    RAISE NOTICE 'Added health_score to commit_metrics_history';
  END IF;

  -- 4. SonarQube Reliability History
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='sonarqube_reliability_history' AND column_name='health_score'
  ) THEN
    ALTER TABLE sonarqube_reliability_history 
    ADD COLUMN health_score DECIMAL(3,2) DEFAULT NULL;
    RAISE NOTICE 'Added health_score to sonarqube_reliability_history';
  END IF;

  -- 5. SonarQube Maintainability History
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='sonarqube_maintainability_history' AND column_name='health_score'
  ) THEN
    ALTER TABLE sonarqube_maintainability_history 
    ADD COLUMN health_score DECIMAL(3,2) DEFAULT NULL;
    RAISE NOTICE 'Added health_score to sonarqube_maintainability_history';
  END IF;

  -- 6. SonarQube Security History
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='sonarqube_security_history' AND column_name='health_score'
  ) THEN
    ALTER TABLE sonarqube_security_history 
    ADD COLUMN health_score DECIMAL(3,2) DEFAULT NULL;
    RAISE NOTICE 'Added health_score to sonarqube_security_history';
  END IF;

  RAISE NOTICE 'Migration 015: Health scores added to all 6 history tables successfully';
END $$;
