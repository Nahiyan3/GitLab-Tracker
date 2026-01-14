-- Migration 012: Fix duplicated_lines_new column type
-- Change from INTEGER to DOUBLE PRECISION to accommodate decimal values from SonarQube

ALTER TABLE sonarqube_maintainability_metrics 
  ALTER COLUMN duplicated_lines_new TYPE DOUBLE PRECISION;

-- Success notification
DO $$ 
BEGIN 
  RAISE NOTICE 'Migration 012: Fixed duplicated_lines_new column type to DOUBLE PRECISION';
END $$;
