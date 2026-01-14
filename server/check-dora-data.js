require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkDoraData() {
  console.log('\n🔍 CHECKING DORA METRICS DATA...\n');
  
  try {
    // Check each DORA table
    const tables = [
      'deployment_frequency',
      'lead_time_changes', 
      'change_failure_rate',
      'time_to_restore_service'
    ];
    
    for (const table of tables) {
      console.log(`\n📊 ${table.toUpperCase()}`);
      console.log('='.repeat(60));
      
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`Total rows: ${countResult.rows[0].count}`);
      
      const dataResult = await pool.query(`
        SELECT * FROM ${table} 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      if (dataResult.rows.length > 0) {
        console.log('\nSample data:');
        dataResult.rows.forEach((row, idx) => {
          console.log(`\n  Row ${idx + 1}:`);
          console.log('    id:', row.id);
          console.log('    project_id:', row.project_id);
          
          if (table === 'deployment_frequency') {
            console.log('    deployment_timestamp:', row.deployment_timestamp);
            console.log('    environment:', row.environment);
            console.log('    version:', row.version);
          } else if (table === 'lead_time_changes') {
            console.log('    merged_timestamp:', row.merged_timestamp);
            console.log('    deployed_timestamp:', row.deployed_timestamp);
            console.log('    lead_time_hours:', row.lead_time_hours);
          } else if (table === 'change_failure_rate') {
            console.log('    deployment_timestamp:', row.deployment_timestamp);
            console.log('    has_incident:', row.has_incident);
            console.log('    is_failure:', row.is_failure);
          } else if (table === 'time_to_restore_service') {
            console.log('    start_time:', row.start_time);
            console.log('    end_time:', row.end_time);
            console.log('    restore_time_hours:', row.restore_time_hours);
          }
        });
      } else {
        console.log('  No data found');
      }
    }
    
    // Check by project
    console.log('\n\n📈 DATA BY PROJECT');
    console.log('='.repeat(60));
    
    const projectsResult = await pool.query(`
      SELECT DISTINCT project_id 
      FROM deployment_frequency
      ORDER BY project_id
    `);
    
    console.log(`\nProjects with DORA data: ${projectsResult.rows.length}`);
    
    for (const project of projectsResult.rows) {
      console.log(`\n  Project ID: ${project.project_id}`);
      
      for (const table of tables) {
        const count = await pool.query(
          `SELECT COUNT(*) as count FROM ${table} WHERE project_id = $1`,
          [project.project_id]
        );
        console.log(`    ${table}: ${count.rows[0].count} rows`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDoraData();
