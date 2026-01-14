require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkDatabaseDetails() {
  try {
    console.log('\n=== DETAILED DATABASE CHECK ===\n');
    
    // 1. Check for milestone_health_metrics vs milestone_metrics
    console.log('1️⃣ Checking milestone tables...');
    const milestoneCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'milestone%'
      ORDER BY table_name
    `);
    console.log('   Found:', milestoneCheck.rows.map(r => r.table_name).join(', '));
    
    // 2. Check for foreign key issues
    console.log('\n2️⃣ Checking foreign key constraints...');
    const fkCheck = await pool.query(`
      SELECT 
        tc.table_name, 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name;
    `);
    console.log('   Found', fkCheck.rows.length, 'foreign key constraints');
    fkCheck.rows.forEach(fk => {
      console.log(`   - ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    // 3. Check for orphaned tables (no foreign keys)
    console.log('\n3️⃣ Checking for tables without foreign keys...');
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    const tablesWithFKs = new Set(fkCheck.rows.map(r => r.table_name));
    const tablesWithoutFKs = allTables.rows.filter(r => !tablesWithFKs.has(r.table_name));
    console.log('   Tables without foreign keys:');
    tablesWithoutFKs.forEach(t => console.log('   -', t.table_name));
    
    // 4. Check for incorrect foreign key references
    console.log('\n4️⃣ Checking for project_id vs project_uuid issues...');
    const projectIdTables = await pool.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND column_name IN ('project_id', 'project_uuid')
      ORDER BY table_name, column_name
    `);
    console.log('   Tables with project references:');
    const tableGroups = {};
    projectIdTables.rows.forEach(col => {
      if (!tableGroups[col.table_name]) tableGroups[col.table_name] = [];
      tableGroups[col.table_name].push(`${col.column_name} (${col.data_type})`);
    });
    Object.entries(tableGroups).forEach(([table, cols]) => {
      console.log(`   - ${table}: ${cols.join(', ')}`);
    });
    
    // 5. Check projects table structure
    console.log('\n5️⃣ Checking projects table primary key...');
    const projectsPK = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name IN ('id', 'uuid')
      ORDER BY column_name
    `);
    console.log('   Projects table keys:');
    projectsPK.rows.forEach(col => console.log(`   - ${col.column_name}: ${col.data_type}`));
    
    // Check actual PK constraint
    const pkConstraint = await pool.query(`
      SELECT a.attname, format_type(a.atttypid, a.atttypmod) AS data_type
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = 'projects'::regclass AND i.indisprimary;
    `);
    console.log('   Primary key is:', pkConstraint.rows[0]?.attname || 'NOT FOUND');
    
    // 6. Try inserting a test row to check for issues
    console.log('\n6️⃣ Testing insert capability...');
    try {
      await pool.query('BEGIN');
      await pool.query(`
        INSERT INTO projects (id, name, full_path, tracked)
        VALUES (999999, 'TEST_PROJECT', 'test/project', false)
        ON CONFLICT (id) DO NOTHING
        RETURNING uuid, id
      `);
      await pool.query('ROLLBACK');
      console.log('   ✅ Insert test successful (rolled back)');
    } catch (insertError) {
      await pool.query('ROLLBACK');
      console.log('   ❌ Insert test failed:', insertError.message);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabaseDetails();
