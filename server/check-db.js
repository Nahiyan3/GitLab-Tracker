require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkDatabase() {
  try {
    console.log('\n=== CHECKING DATABASE TABLES ===\n');
    
    // Get all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Existing Tables (' + tablesResult.rows.length + '):');
    tablesResult.rows.forEach(row => console.log('  ✓', row.table_name));
    
    // Check for required tables
    const requiredTables = [
      'projects',
      'tracked_project_snapshots',
      'project_insights',
      'issue_health_metrics',
      'issue_metrics_history',
      'mr_health_metrics',
      'mr_metrics_history',
      'commit_health_metrics',
      'commit_metrics_history',
      'sonarqube_maintainability_metrics',
      'sonarqube_maintainability_history',
      'sonarqube_reliability_metrics',
      'sonarqube_reliability_history',
      'sonarqube_security_metrics',
      'sonarqube_security_history',
      'milestone_health_metrics',
      'deployment_frequency',
      'lead_time_changes',
      'change_failure_rate',
      'time_to_restore_service',
      'weekly_dora_snapshots'
    ];
    
    const existingTables = tablesResult.rows.map(r => r.table_name);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.log('\n❌ Missing Tables (' + missingTables.length + '):');
      missingTables.forEach(table => console.log('  ✗', table));
    } else {
      console.log('\n✅ All required tables exist!');
    }
    
    // Check columns in projects table if it exists
    if (existingTables.includes('projects')) {
      console.log('\n📋 Checking projects table columns...');
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'projects'
        ORDER BY ordinal_position
      `);
      console.log('  Columns:', columnsResult.rows.length);
      columnsResult.rows.forEach(col => 
        console.log(`    - ${col.column_name} (${col.data_type})`)
      );
    }
    
    // Check for any data
    if (existingTables.includes('projects')) {
      const countResult = await pool.query('SELECT COUNT(*) FROM projects');
      console.log('\n📊 Projects table has', countResult.rows[0].count, 'rows');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

checkDatabase();
