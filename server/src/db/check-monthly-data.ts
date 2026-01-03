// Check monthly breakdown for all 24 months
import 'dotenv/config';
import { getPool } from './connection';

async function checkMonthlyData() {
  const pool = getPool();
  
  try {
    console.log('\n📅 MONTHLY BREAKDOWN - All 24 Months\n');
    console.log('='.repeat(80));
    
    // Check all months have data
    const monthlyData = await pool.query(`
      SELECT 
        TO_CHAR(deployment_timestamp, 'YYYY-MM') AS month,
        COUNT(*) AS deployments
      FROM deployment_frequency
      WHERE project_id = 1
      GROUP BY TO_CHAR(deployment_timestamp, 'YYYY-MM')
      ORDER BY month
    `);
    
    console.log('\n📊 Deployment Frequency by Month:');
    console.table(monthlyData.rows);
    
    console.log('\n✅ Total Months with Data:', monthlyData.rows.length);
    console.log('Expected: 24 months (12 for 2024 + 12 for 2025)\n');
    
    if (monthlyData.rows.length === 24) {
      console.log('🎉 SUCCESS! All 24 months have data!');
    } else {
      console.log('⚠️  Warning: Expected 24 months but found', monthlyData.rows.length);
    }
    
    // Check date ranges
    const dateRanges = await pool.query(`
      SELECT 
        MIN(deployment_timestamp) as earliest,
        MAX(deployment_timestamp) as latest
      FROM deployment_frequency
      WHERE project_id = 1
    `);
    
    console.log('\n📍 Date Range:');
    console.log('  Earliest:', dateRanges.rows[0].earliest);
    console.log('  Latest:', dateRanges.rows[0].latest);
    
    // Check lead time monthly data
    const monthlyLeadTime = await pool.query(`
      SELECT 
        TO_CHAR(merged_timestamp, 'YYYY-MM') AS month,
        COUNT(*) AS changes,
        ROUND(AVG(lead_time_hours), 2) AS avg_hours
      FROM lead_time_changes
      WHERE project_id = 1
      GROUP BY TO_CHAR(merged_timestamp, 'YYYY-MM')
      ORDER BY month
    `);
    
    console.log('\n\n📊 Lead Time by Month:');
    console.table(monthlyLeadTime.rows);
    
    console.log('\n✅ Months with Lead Time Data:', monthlyLeadTime.rows.length);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMonthlyData();
