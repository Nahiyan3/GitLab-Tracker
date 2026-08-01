// Clear and repopulate DORA metrics with correct date ranges
import 'dotenv/config';
import { getPool } from './connection';
import * as fs from 'fs';
import * as path from 'path';

async function clearAndRepopulateDoraMetrics() {
  const pool = getPool();
  
  try {
    console.log('🗑️  Clearing existing DORA metrics data...');
    console.log('📊 Repopulating with correct date ranges (52 weeks each year)...\n');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'seeds', 'clear_and_repopulate_dora_metrics.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('\n✅ Successfully cleared and repopulated DORA metrics data!');
    console.log('Data includes:');
    console.log('  - 2024: 52 weeks (Jan-Dec 2024) - learning phase');
    console.log('  - 2025: 52 weeks (Jan-Dec 2025) - mature phase');
    console.log('  - All 4 DORA metrics tables updated');
    console.log('  - All 24 months should now have data\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearAndRepopulateDoraMetrics();
