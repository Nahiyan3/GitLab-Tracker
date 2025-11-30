-- ============================================================================
-- MIGRATION 007: Add Closure Rate Metrics
-- ============================================================================
-- Add closure rate fields to both issue and MR metrics tables
-- Closure Rate = (Closed/Merged in last 30d) / (Opened in last 30d) * 100

-- Add to issue_health_metrics
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='issue_health_metrics' AND column_name='closure_rate_percent') THEN
    ALTER TABLE issue_health_metrics ADD COLUMN closure_rate_percent FLOAT DEFAULT 0;
  END IF;
END $$;

-- Add to issue_metrics_history  
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='issue_metrics_history' AND column_name='closure_rate_percent') THEN
    ALTER TABLE issue_metrics_history ADD COLUMN closure_rate_percent FLOAT DEFAULT 0;
  END IF;
END $$;

-- Add to mr_health_metrics
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mr_health_metrics' AND column_name='closure_rate_percent') THEN
    ALTER TABLE mr_health_metrics ADD COLUMN closure_rate_percent FLOAT DEFAULT 0;
  END IF;
END $$;

-- Add to mr_metrics_history
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mr_metrics_history' AND column_name='closure_rate_percent') THEN
    ALTER TABLE mr_metrics_history ADD COLUMN closure_rate_percent FLOAT DEFAULT 0;
  END IF;
END $$;
