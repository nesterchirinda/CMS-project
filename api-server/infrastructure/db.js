// PURPOSE: Creates and exports the PostgreSQL connection pool using pg library

const { Pool } = require('pg');

// connects to Supabase PostgreSQL using connection string from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
