const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
};

async function getProcBody(procName) {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query(`
            SHOW CREATE PROCEDURE ??
        `, [procName]);
        if (rows.length > 0) {
            console.log(rows[0]['Create Procedure']);
        } else {
            console.log("Procedure not found in DB.");
        }
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

const procName = process.argv[2] || 'Update_Email_Opened';
getProcBody(procName);
