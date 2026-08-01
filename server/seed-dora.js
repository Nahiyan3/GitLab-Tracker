// Seed DORA metrics for project 75430168 (Pet-Care) — 2 years of data
// Uses batch inserts for speed over remote Neon DB
require('dotenv').config();
const { Pool } = require('pg');

const PROJECT_ID = 75430168;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Helper: batch insert using unnest for maximum speed
async function batchInsert(client, table, columns, rows) {
  if (rows.length === 0) return;
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const placeholders = chunk.map((row, ri) =>
      `(${row.map((_, ci) => `$${ri * row.length + ci + 1}`).join(',')})`
    ).join(',');
    const values = chunk.flat();
    await client.query(
      `INSERT INTO ${table} (${columns.join(',')}) VALUES ${placeholders}`,
      values
    );
  }
}

async function seed() {
  const client = await pool.connect();
  try {
    // Clean any leftover data first
    console.log('🧹 Cleaning existing DORA data for project...');
    await client.query('DELETE FROM time_to_restore_service WHERE project_id=$1', [PROJECT_ID]);
    await client.query('DELETE FROM change_failure_rate WHERE project_id=$1', [PROJECT_ID]);
    await client.query('DELETE FROM lead_time_changes WHERE project_id=$1', [PROJECT_ID]);
    await client.query('DELETE FROM deployment_frequency WHERE project_id=$1', [PROJECT_ID]);

    await client.query('BEGIN');

    // ========== 1. DEPLOYMENT FREQUENCY ==========
    console.log('🔄 Building deployment_frequency data...');
    const dfRows = [];

    for (let week = 0; week <= 103; week++) {
      const baseDate = new Date('2024-01-01');
      baseDate.setDate(baseDate.getDate() + week * 7);
      let depsPerWeek;
      if (week < 26) depsPerWeek = 1;
      else if (week < 52) depsPerWeek = week % 2 === 0 ? 2 : 1;
      else depsPerWeek = 2;
      for (let d = 1; d <= depsPerWeek; d++) {
        const hourOffset = (d - 1) * Math.floor((24 * 7) / depsPerWeek);
        const ts = new Date(baseDate);
        ts.setHours(ts.getHours() + hourOffset + (d % 2 === 0 ? 14 : 10));
        dfRows.push([PROJECT_ID, `deploy-2024-w${week}-${d}`, `1.${Math.floor(week/4)}.${d}`, 'production', ts.toISOString()]);
      }
    }
    for (let week = 0; week <= 51; week++) {
      const baseDate = new Date('2025-01-01');
      baseDate.setDate(baseDate.getDate() + week * 7);
      let depsPerWeek;
      if (week < 13) depsPerWeek = 2;
      else if (week < 26) depsPerWeek = 3;
      else if (week < 39) depsPerWeek = 4;
      else depsPerWeek = 5;
      for (let d = 1; d <= depsPerWeek; d++) {
        const hourOffset = (d - 1) * Math.floor((24 * 7) / depsPerWeek);
        const ts = new Date(baseDate);
        ts.setHours(ts.getHours() + hourOffset + (d % 2 === 0 ? 15 : 11));
        dfRows.push([PROJECT_ID, `deploy-2025-w${week}-${d}`, `2.${Math.floor(week/4)}.${d}`, 'production', ts.toISOString()]);
      }
    }
    await batchInsert(client, 'deployment_frequency',
      ['project_id','deployment_id','version','environment','deployment_timestamp'], dfRows);
    console.log(`   ✅ ${dfRows.length} deployment_frequency rows`);

    // ========== 2. LEAD TIME FOR CHANGES ==========
    console.log('🔄 Building lead_time_changes data...');
    const ltRows = [];

    for (let week = 0; week <= 103; week++) {
      const baseDate = new Date('2024-01-01');
      baseDate.setDate(baseDate.getDate() + week * 7);
      const changesPerWeek = 2 + Math.floor(week / 26);
      for (let c = 1; c <= changesPerWeek; c++) {
        let lth;
        if (week < 26) lth = 180 + Math.random() * 50;
        else if (week < 52) lth = 140 + Math.random() * 40;
        else if (week < 78) lth = 100 + Math.random() * 40;
        else lth = 72 + Math.random() * 48;
        const mergedTs = new Date(baseDate); mergedTs.setHours(mergedTs.getHours() + c * 36);
        const deployedTs = new Date(mergedTs); deployedTs.setHours(deployedTs.getHours() + lth);
        ltRows.push([PROJECT_ID, `mr-2024-w${week}-${c}`, mergedTs.toISOString(), deployedTs.toISOString(), Math.round(lth*100)/100]);
      }
    }
    for (let week = 0; week <= 51; week++) {
      const baseDate = new Date('2025-01-01');
      baseDate.setDate(baseDate.getDate() + week * 7);
      const changesPerWeek = 4 + Math.floor(week / 13);
      for (let c = 1; c <= changesPerWeek; c++) {
        let lth;
        if (week < 13) lth = 60 + Math.random() * 36;
        else if (week < 26) lth = 48 + Math.random() * 24;
        else if (week < 39) lth = 32 + Math.random() * 24;
        else lth = 24 + Math.random() * 24;
        const mergedTs = new Date(baseDate); mergedTs.setHours(mergedTs.getHours() + c * 24);
        const deployedTs = new Date(mergedTs); deployedTs.setHours(deployedTs.getHours() + lth);
        ltRows.push([PROJECT_ID, `mr-2025-w${week}-${c}`, mergedTs.toISOString(), deployedTs.toISOString(), Math.round(lth*100)/100]);
      }
    }
    await batchInsert(client, 'lead_time_changes',
      ['project_id','change_id','merged_timestamp','deployed_timestamp','lead_time_hours'], ltRows);
    console.log(`   ✅ ${ltRows.length} lead_time_changes rows`);

    // ========== 3. CHANGE FAILURE RATE ==========
    console.log('🔄 Building change_failure_rate data...');
    const cfrRows = [];

    for (let week = 0; week <= 103; week++) {
      const baseDate = new Date('2024-01-01');
      baseDate.setDate(baseDate.getDate() + week * 7);
      let depsPerWeek;
      if (week < 26) depsPerWeek = 1;
      else if (week < 52) depsPerWeek = week % 2 === 0 ? 2 : 1;
      else depsPerWeek = 2;
      for (let d = 1; d <= depsPerWeek; d++) {
        let ft;
        if (week < 26) ft = 0.35;
        else if (week < 52) ft = 0.30;
        else if (week < 78) ft = 0.22;
        else ft = 0.18;
        const isFail = Math.random() < ft;
        let rem;
        if (isFail) { const r = Math.random(); rem = r < 0.4 ? 'rollback' : r < 0.7 ? 'hotfix' : 'emergency'; }
        else { rem = Math.random() < 0.1 ? 'patch' : 'none'; }
        const ts = new Date(baseDate); ts.setHours(ts.getHours() + (d-1)*72 + 14);
        cfrRows.push([PROJECT_ID, `deploy-2024-w${week}-${d}`, ts.toISOString(), isFail || rem === 'patch', rem, isFail]);
      }
    }
    for (let week = 0; week <= 51; week++) {
      const baseDate = new Date('2025-01-01');
      baseDate.setDate(baseDate.getDate() + week * 7);
      let depsPerWeek;
      if (week < 13) depsPerWeek = 2;
      else if (week < 26) depsPerWeek = 3;
      else if (week < 39) depsPerWeek = 4;
      else depsPerWeek = 5;
      for (let d = 1; d <= depsPerWeek; d++) {
        let ft;
        if (week < 13) ft = 0.15;
        else if (week < 26) ft = 0.12;
        else if (week < 39) ft = 0.10;
        else ft = 0.08;
        const isFail = Math.random() < ft;
        let rem;
        if (isFail) { const r = Math.random(); rem = r < 0.3 ? 'rollback' : r < 0.6 ? 'hotfix' : 'emergency'; }
        else { rem = Math.random() < 0.08 ? 'patch' : 'none'; }
        const ts = new Date(baseDate); ts.setHours(ts.getHours() + (d-1)*36 + 15);
        cfrRows.push([PROJECT_ID, `deploy-2025-w${week}-${d}`, ts.toISOString(), isFail || rem === 'patch', rem, isFail]);
      }
    }
    await batchInsert(client, 'change_failure_rate',
      ['project_id','deployment_id','deployment_timestamp','has_incident','remediation_type','is_failure'], cfrRows);
    console.log(`   ✅ ${cfrRows.length} change_failure_rate rows`);

    // ========== 4. TIME TO RESTORE SERVICE ==========
    console.log('🔄 Building time_to_restore_service data...');
    const ttrRows = [];
    const descs = [
      'Database connection pool exhausted','Memory leak in API service','Third-party service timeout',
      'Configuration error after deployment','SSL certificate expiration','Load balancer misconfiguration',
      'Cache invalidation issue','Rate limiting bug','Authentication service outage','Database query performance degradation',
    ];
    let inc = 0;

    for (let week = 0; week <= 103; week++) {
      const baseDate = new Date('2024-01-01');
      baseDate.setDate(baseDate.getDate() + week * 7);
      let prob;
      if (week < 26) prob = 0.5; else if (week < 52) prob = 0.4; else if (week < 78) prob = 0.3; else prob = 0.25;
      if (Math.random() < prob) {
        inc++;
        let rh;
        if (week < 26) rh = 12 + Math.random() * 12;
        else if (week < 52) rh = 8 + Math.random() * 10;
        else if (week < 78) rh = 6 + Math.random() * 8;
        else rh = 4 + Math.random() * 6;
        const st = new Date(baseDate); st.setDate(st.getDate()+Math.floor(Math.random()*6)); st.setHours(st.getHours()+Math.floor(Math.random()*24));
        const et = new Date(st); et.setHours(et.getHours()+rh);
        ttrRows.push([PROJECT_ID, `incident-2024-${inc}`, st.toISOString(), et.toISOString(), Math.round(rh*100)/100, descs[Math.floor(Math.random()*descs.length)]]);
      }
    }
    for (let week = 0; week <= 51; week++) {
      const baseDate = new Date('2025-01-01');
      baseDate.setDate(baseDate.getDate() + week * 7);
      let prob;
      if (week < 13) prob = 0.2; else if (week < 26) prob = 0.15; else if (week < 39) prob = 0.12; else prob = 0.10;
      if (Math.random() < prob) {
        inc++;
        let rh;
        if (week < 13) rh = 3 + Math.random() * 5;
        else if (week < 26) rh = 2 + Math.random() * 4;
        else if (week < 39) rh = 1.5 + Math.random() * 3;
        else rh = 1 + Math.random() * 2;
        const st = new Date(baseDate); st.setDate(st.getDate()+Math.floor(Math.random()*6)); st.setHours(st.getHours()+Math.floor(Math.random()*24));
        const et = new Date(st); et.setHours(et.getHours()+rh);
        ttrRows.push([PROJECT_ID, `incident-2025-${inc}`, st.toISOString(), et.toISOString(), Math.round(rh*100)/100, descs[Math.floor(Math.random()*descs.length)]]);
      }
    }
    await batchInsert(client, 'time_to_restore_service',
      ['project_id','incident_id','start_time','end_time','restore_time_hours','description'], ttrRows);
    console.log(`   ✅ ${ttrRows.length} time_to_restore_service rows`);

    await client.query('COMMIT');
    console.log(`\n🎉 Done! Seeded DORA metrics for project ${PROJECT_ID} (Pet-Care)`);
    console.log(`   deployment_frequency:    ${dfRows.length}`);
    console.log(`   lead_time_changes:       ${ltRows.length}`);
    console.log(`   change_failure_rate:     ${cfrRows.length}`);
    console.log(`   time_to_restore_service: ${ttrRows.length}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding DORA data:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
