const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSpecificLog() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'avies_db'
    });

    try {
        const [rows] = await connection.execute('SELECT * FROM email_logs WHERE Log_ID = 51');
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkSpecificLog();
