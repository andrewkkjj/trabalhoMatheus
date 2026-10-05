const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function testConnection() {
    try {
        const result = await pool.query(`
            SELECT
                current_database() AS database,
                current_user AS usuario,
                NOW() AS server_time
        `);

        return {
            message: "Conexão com PostgreSQL realizada com sucesso.",
            database: result.rows[0].database,
            usuario: result.rows[0].usuario,
            server_time: result.rows[0].server_time
        };

    } catch (error) {
        console.error("Erro ao conectar no PostgreSQL:");
        console.error(error.message);

        throw error;
    }
}

module.exports = {
    pool,
    testConnection
};