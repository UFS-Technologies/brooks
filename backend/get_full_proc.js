const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
};

async function getFullProc() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query('SHOW CREATE PROCEDURE Login_Check');
        console.log("FULL PROCEDURE BODY:");
        console.log(rows[0]["Create Procedure"]);
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

getFullProc();
