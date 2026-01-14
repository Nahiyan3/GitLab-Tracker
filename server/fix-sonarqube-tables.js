require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixMissingTables() {
  console.log('\n🔧 FIXING MISSING SONARQUBE TABLES...\n');
  
  try {
    // Fix Migration 011: Create SonarQube Maintainability tables
    console.log('1️⃣ Creating SonarQube Maintainability tables...');
    
    await pool.query(`
      -- Create sonarqube_maintainability_metrics table
      CREATE TABLE IF NOT EXISTS sonarqube_maintainability_metrics (
        uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        row_id SERIAL NOT NULL,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        maintainability_high INTEGER DEFAULT 0,
        maintainability_blocker INTEGER DEFAULT 0,
        technical_debt_ratio DOUBLE PRECISION DEFAULT 0,
        maintainability_rating VARCHAR(1) DEFAULT 'A',
        maintainability_rating_value INTEGER DEFAULT 1,
        code_smells_total INTEGER DEFAULT 0,
        code_smells_new INTEGER DEFAULT 0,
        cyclomatic_complexity INTEGER DEFAULT 0,
        cognitive_complexity INTEGER DEFAULT 0,
        duplicated_code_percentage DOUBLE PRECISION DEFAULT 0,
        duplicated_lines_new DOUBLE PRECISION DEFAULT 0,
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('   ✅ sonarqube_maintainability_metrics created');
    
    await pool.query(`
      -- Create indexes for maintainability metrics
      CREATE INDEX IF NOT EXISTS idx_sonar_maintainability_project_id 
        ON sonarqube_maintainability_metrics(project_id);
      CREATE INDEX IF NOT EXISTS idx_sonar_maintainability_calculated_at 
        ON sonarqube_maintainability_metrics(calculated_at);
    `);
    console.log('   ✅ Indexes created');
    
    await pool.query(`
      -- Create sonarqube_maintainability_history table (daily snapshots)
      CREATE TABLE IF NOT EXISTS sonarqube_maintainability_history (
        uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        row_id SERIAL NOT NULL,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        maintainability_high INTEGER DEFAULT 0,
        maintainability_blocker INTEGER DEFAULT 0,
        technical_debt_ratio DOUBLE PRECISION DEFAULT 0,
        maintainability_rating VARCHAR(1) DEFAULT 'A',
        code_smells_total INTEGER DEFAULT 0,
        duplicated_code_percentage DOUBLE PRECISION DEFAULT 0,
        snapshot_date DATE NOT NULL,
        CONSTRAINT sonar_maintainability_history_unique UNIQUE (project_id, snapshot_date)
      );
    `);
    console.log('   ✅ sonarqube_maintainability_history created');
    
    await pool.query(`
      -- Create indexes for history table
      CREATE INDEX IF NOT EXISTS idx_sonar_maintainability_history_project_date 
        ON sonarqube_maintainability_history(project_id, snapshot_date);
    `);
    console.log('   ✅ History indexes created');
    
    // Apply Migration 015: Add health_score columns
    console.log('\n2️⃣ Adding health_score columns to history tables...');
    
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'sonarqube_maintainability_history' 
          AND column_name = 'health_score'
        ) THEN
          ALTER TABLE sonarqube_maintainability_history 
          ADD COLUMN health_score DECIMAL(5,2) DEFAULT 0;
        END IF;
      END $$;
    `);
    console.log('   ✅ health_score column added to sonarqube_maintainability_history');
    
    // Apply Migration 016: Remove UNIQUE constraints
    console.log('\n3️⃣ Removing UNIQUE constraints for multiple snapshots...');
    
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'sonar_maintainability_history_unique'
        ) THEN
          ALTER TABLE sonarqube_maintainability_history 
          DROP CONSTRAINT sonar_maintainability_history_unique;
        END IF;
      END $$;
    `);
    console.log('   ✅ UNIQUE constraint removed from sonarqube_maintainability_history');
    
    // Verify fixes
    console.log('\n4️⃣ Verifying fixes...');
    
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'sonarqube_maintainability%'
      ORDER BY table_name
    `);
    
    console.log('   Found SonarQube Maintainability tables:');
    tableCheck.rows.forEach(row => console.log('     ✓', row.table_name));
    
    const columnCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sonarqube_maintainability_history' 
      AND column_name = 'health_score'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('   ✅ health_score column exists');
    }
    
    console.log('\n✅ ALL FIXES APPLIED SUCCESSFULLY!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

fixMissingTables();
