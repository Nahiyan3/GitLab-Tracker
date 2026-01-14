-- ============================================================================
-- DATABASE FIX SCRIPT
-- ============================================================================
-- This script fixes foreign key mismatches and missing tables
-- Run this to fix database schema issues

-- ============================================================================
-- 1. CREATE MILESTONE_HEALTH_METRICS TABLE (if needed as alias)
-- ============================================================================
-- Note: milestone_metrics already exists, this creates the expected name

CREATE TABLE IF NOT EXISTS milestone_health_metrics (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Milestone Counts
  total_milestones INTEGER DEFAULT 0,
  open_milestones INTEGER DEFAULT 0,
  closed_milestones INTEGER DEFAULT 0,
  overdue_milestones INTEGER DEFAULT 0,
  
  -- Completion Metrics
  avg_completion_rate DECIMAL(5,2) DEFAULT 0,
  on_time_completion_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Time Metrics
  avg_duration_days DECIMAL(10,2) DEFAULT 0,
  avg_overdue_days DECIMAL(10,2) DEFAULT 0,
  
  -- Health Score
  health_score DECIMAL(5,2) DEFAULT 0,
  
  -- Metadata
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_milestone_health_project_id ON milestone_health_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_milestone_health_calculated_at ON milestone_health_metrics(calculated_at DESC);

-- ============================================================================
-- 2. VERIFY ALL FOREIGN KEYS POINT TO CORRECT COLUMNS
-- ============================================================================
-- All integer project_id columns should reference projects(id)
-- All uuid project_uuid columns should reference projects(uuid)
-- Both id and uuid exist in projects table, so this should work

-- Check if id column has UNIQUE constraint (required for foreign keys)
DO $$
BEGIN
  -- Add UNIQUE constraint to projects.id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'projects_id_key' 
    AND conrelid = 'projects'::regclass
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT projects_id_key UNIQUE (id);
    RAISE NOTICE 'Added UNIQUE constraint to projects.id';
  END IF;
END $$;

-- ============================================================================
-- 3. CREATE VIEW FOR BACKWARD COMPATIBILITY
-- ============================================================================
-- Create milestone_health_metrics as a view of milestone_metrics if needed

DO $$
BEGIN
  -- Only create if table doesn't exist but milestone_metrics does
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'milestone_health_metrics')
  AND EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'milestone_metrics') THEN
    EXECUTE '
      CREATE OR REPLACE VIEW milestone_health_metrics AS
      SELECT * FROM milestone_metrics
    ';
    RAISE NOTICE 'Created milestone_health_metrics view';
  END IF;
END $$;

-- ============================================================================
-- 4. VERIFY DATA INTEGRITY
-- ============================================================================

-- Check for orphaned records (project_id not in projects)
DO $$
DECLARE
  orphan_count INTEGER;
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'project_id' 
    AND table_schema = 'public'
  LOOP
    EXECUTE format('
      SELECT COUNT(*) FROM %I 
      WHERE project_id NOT IN (SELECT id FROM projects)
    ', table_record.table_name) INTO orphan_count;
    
    IF orphan_count > 0 THEN
      RAISE WARNING 'Table % has % orphaned records', table_record.table_name, orphan_count;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Data integrity check complete';
END $$;

-- ============================================================================
-- 5. ADD MISSING INDEXES
-- ============================================================================

-- Ensure projects.id has an index for foreign key performance
CREATE INDEX IF NOT EXISTS idx_projects_id_lookup ON projects(id);

COMMENT ON INDEX idx_projects_id_lookup IS 'Performance index for foreign key lookups on projects.id';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show table count
SELECT 'Total tables:' as info, COUNT(*) as count 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Show foreign key count
SELECT 'Total foreign keys:' as info, COUNT(*) as count
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY' 
AND table_schema = 'public';

-- Show projects table structure
SELECT 'Projects table has:' as info, 
  (SELECT COUNT(*) FROM projects) as total_rows,
  (SELECT COUNT(DISTINCT id) FROM projects) as unique_ids,
  (SELECT COUNT(DISTINCT uuid) FROM projects) as unique_uuids;
