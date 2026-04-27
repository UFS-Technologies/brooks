const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
};

async function findTable() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [dbs] = await connection.query("SHOW DATABASES");
        for (const db of dbs) {
            const dbName = db.Database;
            try {
                const [tables] = await connection.query(`SHOW TABLES FROM \`${dbName}\` LIKE 'menu'`);
                if (tables.length > 0) {
                    const [rows] = await connection.query(`SELECT COUNT(*) as count FROM \`${dbName}\`.menu`);
                    console.log(`Database ${dbName} has menu table with ${rows[0].count} rows.`);
                }
            } catch (e) {
                // Ignore errors for dbs we can't access
            }
        }
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

findTable();
