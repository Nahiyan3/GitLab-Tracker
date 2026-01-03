// Script to populate DORA metrics with 2 years of data
import 'dotenv/config';
import { getPool } from './connection';
import * as fs from 'fs';
import * as path from 'path';

async function populateDoraMetrics() {
  const pool = getPool();
  
  try {
    console.log('Starting DORA metrics population...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'migrations', 'populate_dora_metrics_2_years_fixed.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('\n✅ Successfully populated DORA metrics data!');
    console.log('Data includes:');
    console.log('  - 2024: 104 weeks of data (learning phase)');
    console.log('  - 2025: 52 weeks of data (mature phase)');
    console.log('  - All 4 DORA metrics tables populated');
    console.log('  - Clear trends showing improvement over time');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating DORA metrics:', error);
    process.exit(1);
  }
}

populateDoraMetrics();
