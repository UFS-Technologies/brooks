const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "avies_db",
    multipleStatements: true,
};

async function getSpDefinition() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to DB.");

        const [rows] = await connection.query("SHOW CREATE PROCEDURE Search_User");
        console.log("SP Definition:");
        console.log(rows[0]['Create Procedure']);

        await connection.end();
    } catch (e) {
        console.error("Error:", e);
        if (connection) await connection.end();
    }
}

getSpDefinition();
