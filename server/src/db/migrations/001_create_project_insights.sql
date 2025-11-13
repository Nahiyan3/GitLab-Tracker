-- Migration: Create project_insights table
-- Run this if the table doesn't exist yet

CREATE TABLE IF NOT EXISTS project_insights (
  -- Primary Keys
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  
  -- Foreign Key (links to projects table)
  project_uuid UUID NOT NULL REFERENCES projects(uuid) ON DELETE CASCADE,
  
  -- Corrected Insights Data (JSONB with verified scores)
  insights_data JSONB NOT NULL,
  
  -- Denormalized Scores (for fast filtering)
  final_user_score DECIMAL(3,2),
  api_score DECIMAL(3,2),
  combined_score DECIMAL(3,2),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT fk_insights_project FOREIGN KEY (project_uuid) REFERENCES projects(uuid) ON DELETE CASCADE
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_insights_project_uuid ON project_insights(project_uuid);
CREATE INDEX IF NOT EXISTS idx_insights_scores ON project_insights(combined_score DESC, final_user_score, api_score);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON project_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_jsonb ON project_insights USING GIN (insights_data);

-- Verify table creation
SELECT 'project_insights table created successfully!' as message;
