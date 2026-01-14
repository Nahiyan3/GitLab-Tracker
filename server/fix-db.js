require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixDatabase() {
  try {
    console.log('\n🔧 FIXING DATABASE ISSUES...\n');
    
    // Read the fix SQL file
    const fixSqlPath = path.join(__dirname, 'src', 'db', 'migrations', 'fix-database-issues.sql');
    const fixSql = fs.readFileSync(fixSqlPath, 'utf8');
    
    console.log('📄 Executing fix script...');
    await pool.query(fixSql);
    console.log('✅ Fix script executed successfully\n');
    
    // Verify the fixes
    console.log('🔍 VERIFYING FIXES...\n');
    
    // 1. Check if milestone_health_metrics exists now
    const milestoneCheck = await pool.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'milestone_health_metrics'
    `);
    
    if (milestoneCheck.rows.length > 0) {
      console.log('✅ milestone_health_metrics exists as:', milestoneCheck.rows[0].table_type);
    } else {
      console.log('❌ milestone_health_metrics still missing');
    }
    
    // 2. Check UNIQUE constraint on projects.id
    const uniqueCheck = await pool.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'projects'
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%id%'
    `);
    
    if (uniqueCheck.rows.length > 0) {
      console.log('✅ projects.id has UNIQUE constraint:', uniqueCheck.rows[0].constraint_name);
    } else {
      console.log('⚠️  projects.id UNIQUE constraint not found (may use PRIMARY KEY)');
    }
    
    // 3. Count all tables
    const tableCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📊 Total tables:', tableCount.rows[0].count);
    
    // 4. Check for orphaned records
    console.log('\n🔍 Checking for orphaned records...');
    const tables = [
      'issue_health_metrics',
      'mr_health_metrics',
      'commit_health_metrics',
      'milestone_metrics',
      'deployment_frequency',
      'lead_time_changes',
      'change_failure_rate',
      'time_to_restore_service'
    ];
    
    for (const table of tables) {
      try {
        const orphanCheck = await pool.query(`
          SELECT COUNT(*) as count
          FROM ${table}
          WHERE project_id NOT IN (SELECT id FROM projects)
        `);
        const orphanCount = parseInt(orphanCheck.rows[0].count);
        if (orphanCount > 0) {
          console.log(`  ⚠️  ${table}: ${orphanCount} orphaned records`);
        } else {
          console.log(`  ✅ ${table}: no orphaned records`);
        }
      } catch (err) {
        console.log(`  ⏭️  ${table}: skipped (${err.message})`);
      }
    }
    
    console.log('\n✅ DATABASE FIX COMPLETE!\n');
    
  } catch (error) {
    console.error('\n❌ Error fixing database:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

fixDatabase();
