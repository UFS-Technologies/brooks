const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
};

async function getProcBody() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query(`
            SELECT ROUTINE_DEFINITION 
            FROM information_schema.ROUTINES 
            WHERE ROUTINE_TYPE = 'PROCEDURE' 
              AND ROUTINE_SCHEMA = 'brooks_db'
              AND ROUTINE_NAME = 'Insert_Login_User'
        `);
        if (rows.length > 0) {
            console.log("PROCEDURE Insert_Login_User:");
            console.log(rows[0].ROUTINE_DEFINITION);
        } else {
            console.log("Procedure not found in DB.");
        }
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

getProcBody();
