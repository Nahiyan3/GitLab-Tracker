-- Remove UNIQUE constraint from milestone_metrics.project_id
-- This allows multiple historical snapshots per project

DO $$
BEGIN
  -- Drop the unique constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'milestone_metrics_project_id_key'
  ) THEN
    ALTER TABLE milestone_metrics DROP CONSTRAINT milestone_metrics_project_id_key;
    RAISE NOTICE 'Dropped UNIQUE constraint on milestone_metrics.project_id';
  END IF;
END $$;
