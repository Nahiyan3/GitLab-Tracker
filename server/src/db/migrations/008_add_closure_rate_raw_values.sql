-- ============================================================================
-- MIGRATION 008: Add Raw Closure Rate Values
-- ============================================================================
-- Store the raw closed/opened counts for historical tracking
-- This allows reconstructing the exact ratio (e.g., "200/3") later

-- Add to issue_metrics_history (already has issues_closed_last_7d)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='issue_metrics_history' AND column_name='issues_opened_last_30d') THEN
    ALTER TABLE issue_metrics_history ADD COLUMN issues_opened_last_30d INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='issue_metrics_history' AND column_name='issues_closed_last_30d') THEN
    ALTER TABLE issue_metrics_history ADD COLUMN issues_closed_last_30d INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add to mr_metrics_history (already has mrs_merged_last_7d)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mr_metrics_history' AND column_name='mrs_opened_last_30d') THEN
    ALTER TABLE mr_metrics_history ADD COLUMN mrs_opened_last_30d INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mr_metrics_history' AND column_name='mrs_merged_last_30d') THEN
    ALTER TABLE mr_metrics_history ADD COLUMN mrs_merged_last_30d INTEGER DEFAULT 0;
  END IF;
END $$;
