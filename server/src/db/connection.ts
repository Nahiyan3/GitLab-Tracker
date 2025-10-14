// Database connection setup for Neon PostgreSQL
import { Pool } from 'pg';

let pool: Pool | null = null;

/**
 * Get or create PostgreSQL connection pool
 */
export const getPool = (): Pool => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Required for Neon
      },
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased timeout
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    console.log('✅ Database pool created successfully');
  }

  return pool;
};

/**
 * Connect to database and verify connection
 */
export const connectDB = async (): Promise<void> => {
  try {
    const pool = getPool();
    const client = await pool.connect();
    
    // Test the connection
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', result.rows[0].now);
    
    client.release();
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
};

/**
 * Close database connection pool
 */
export const closeDB = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ Database connection pool closed');
  }
};

export default { getPool, connectDB, closeDB };
