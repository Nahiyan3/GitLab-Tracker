// Quick script to verify health_score columns were added to all history tables
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD?.toString() || '',
});

async function verifyColumns() {
  const tables = [
    'issue_metrics_history',
    'mr_metrics_history',
    'commit_metrics_history',
    'sonarqube_reliability_history',
    'sonarqube_maintainability_history',
    'sonarqube_security_history'
  ];

  console.log('\n🔍 Verifying health_score columns in all history tables...\n');

  for (const table of tables) {
    try {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'health_score'
      `, [table]);

      if (result.rows.length > 0) {
        const col = result.rows[0];
        console.log(`✅ ${table}: health_score exists (${col.data_type}, nullable: ${col.is_nullable})`);
      } else {
        console.log(`❌ ${table}: health_score column NOT FOUND`);
      }
    } catch (error) {
      console.error(`❌ Error checking ${table}:`, error.message);
    }
  }

  console.log('\n✅ Verification complete!\n');
  await pool.end();
}

verifyColumns().catch(console.error);
