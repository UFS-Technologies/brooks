const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
};

async function checkTables() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const tables = ['users', 'live_class', 'call_history', 'student_live_class', 'login_users'];
        for (const table of tables) {
            console.log(`--- Table: ${table} ---`);
            try {
                const [rows] = await connection.query(`DESCRIBE ${table}`);
                console.table(rows);
            } catch (err) {
                console.error(`Error describing table ${table}:`, err.message);
            }
        }
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

checkTables();
