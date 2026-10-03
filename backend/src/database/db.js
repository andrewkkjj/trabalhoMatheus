const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function testConnection() {
  const result = await pool.query("SELECT current_database() AS database, NOW() AS server_time");
  return result.rows[0];
}

module.exports = { pool, testConnection };
