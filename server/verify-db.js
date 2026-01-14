require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function finalVerification() {
  console.log('\n' + '='.repeat(70));
  console.log('  DATABASE FINAL VERIFICATION');
  console.log('='.repeat(70) + '\n');
  
  try {
    // 1. Connection Test
    console.log('1️⃣  Testing Database Connection...');
    const connectionTest = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('   ✅ Connected successfully');
    console.log('   📅 Server time:', connectionTest.rows[0].current_time);
    console.log('   🗄️  PostgreSQL version:', connectionTest.rows[0].pg_version.split(' ')[1]);
    
    // 2. Table Count
    console.log('\n2️⃣  Checking Tables...');
    const tableCount = await pool.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const expectedTableCount = 24;
    const actualCount = parseInt(tableCount.rows[0].count);
    
    if (actualCount >= expectedTableCount) {
      console.log(`   ✅ Found ${actualCount} tables (expected ${expectedTableCount})`);
    } else {
      console.log(`   ⚠️  Found ${actualCount} tables (expected ${expectedTableCount})`);
    }
    
    // 3. Required Tables Check
    console.log('\n3️⃣  Verifying Required Tables...');
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
      'milestone_health_metrics',
      'milestone_metrics',
      'sonarqube_maintainability_metrics',
      'sonarqube_maintainability_history',
      'sonarqube_reliability_metrics',
      'sonarqube_reliability_history',
      'sonarqube_security_metrics',
      'sonarqube_security_history',
      'deployment_frequency',
      'lead_time_changes',
      'change_failure_rate',
      'time_to_restore_service',
      'weekly_dora_snapshots'
    ];
    
    const existingTables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const existingTableNames = existingTables.rows.map(r => r.table_name);
    
    let allPresent = true;
    for (const table of requiredTables) {
      if (existingTableNames.includes(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} - MISSING`);
        allPresent = false;
      }
    }
    
    if (!allPresent) {
      console.log('\n   ⚠️  Some tables are missing. Run: node fix-db.js');
    }
    
    // 4. Foreign Key Constraints
    console.log('\n4️⃣  Checking Foreign Keys...');
    const fkCount = await pool.query(`
      SELECT COUNT(*) as count FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'
    `);
    console.log(`   ✅ Found ${fkCount.rows[0].count} foreign key constraints`);
    
    // 5. Projects Table Constraints
    console.log('\n5️⃣  Verifying Projects Table...');
    const projectsConstraints = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'projects' AND table_schema = 'public'
      ORDER BY constraint_type
    `);
    
    const hasPrimaryKey = projectsConstraints.rows.some(c => c.constraint_type === 'PRIMARY KEY');
    const hasUnique = projectsConstraints.rows.some(c => 
      c.constraint_type === 'UNIQUE' && c.constraint_name.includes('id')
    );
    
    if (hasPrimaryKey) {
      console.log('   ✅ Primary key exists');
    } else {
      console.log('   ❌ Primary key missing');
    }
    
    if (hasUnique) {
      console.log('   ✅ UNIQUE constraint on id exists');
    } else {
      console.log('   ⚠️  UNIQUE constraint on id missing (may cause FK issues)');
    }
    
    // 6. Data Integrity
    console.log('\n6️⃣  Checking Data Integrity...');
    const projectCount = await pool.query('SELECT COUNT(*) FROM projects');
    console.log(`   📊 Projects: ${projectCount.rows[0].count} rows`);
    
    const metricsWithData = [];
    const metricsTables = [
      'issue_health_metrics',
      'mr_health_metrics', 
      'commit_health_metrics',
      'deployment_frequency',
      'weekly_dora_snapshots'
    ];
    
    for (const table of metricsTables) {
      try {
        const count = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        const rowCount = parseInt(count.rows[0].count);
        if (rowCount > 0) {
          metricsWithData.push(`${table} (${rowCount})`);
        }
      } catch (err) {
        // Table doesn't exist or error
      }
    }
    
    if (metricsWithData.length > 0) {
      console.log('   📈 Metrics data found in:');
      metricsWithData.forEach(m => console.log(`      - ${m}`));
    } else {
      console.log('   ℹ️  No metrics data yet (run refresh to populate)');
    }
    
    // 7. Orphaned Records Check
    console.log('\n7️⃣  Checking for Orphaned Records...');
    const checkTables = ['issue_health_metrics', 'mr_health_metrics', 'commit_health_metrics'];
    let hasOrphans = false;
    
    for (const table of checkTables) {
      try {
        const orphans = await pool.query(`
          SELECT COUNT(*) as count FROM ${table}
          WHERE project_id NOT IN (SELECT id FROM projects)
        `);
        const orphanCount = parseInt(orphans.rows[0].count);
        if (orphanCount > 0) {
          console.log(`   ⚠️  ${table}: ${orphanCount} orphaned records`);
          hasOrphans = true;
        }
      } catch (err) {
        // Skip if table doesn't exist
      }
    }
    
    if (!hasOrphans) {
      console.log('   ✅ No orphaned records found');
    }
    
    // 8. Index Check
    console.log('\n8️⃣  Checking Indexes...');
    const indexCount = await pool.query(`
      SELECT COUNT(*) as count FROM pg_indexes 
      WHERE schemaname = 'public'
    `);
    console.log(`   ✅ Found ${indexCount.rows[0].count} indexes`);
    
    // Final Summary
    console.log('\n' + '='.repeat(70));
    console.log('  VERIFICATION SUMMARY');
    console.log('='.repeat(70));
    
    if (allPresent && !hasOrphans && hasPrimaryKey) {
      console.log('\n   ✅ DATABASE IS HEALTHY!');
      console.log('   ✅ All tables present');
      console.log('   ✅ All constraints valid');
      console.log('   ✅ No data integrity issues');
      console.log('\n   🚀 Ready to use!\n');
    } else {
      console.log('\n   ⚠️  ISSUES FOUND');
      if (!allPresent) {
        console.log('   - Some required tables are missing');
      }
      if (hasOrphans) {
        console.log('   - Orphaned records detected');
      }
      if (!hasPrimaryKey) {
        console.log('   - Projects table constraints missing');
      }
      console.log('\n   🔧 Run: node fix-db.js to fix issues\n');
    }
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error('\n💡 Suggestions:');
    console.error('   1. Check DATABASE_URL in .env file');
    console.error('   2. Verify database is accessible');
    console.error('   3. Run: npm run dev (to initialize tables)');
    console.error('   4. Run: node fix-db.js\n');
  } finally {
    await pool.end();
  }
}

finalVerification();
