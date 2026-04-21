const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
};

async function getSPDefinition() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query("SHOW CREATE PROCEDURE Get_user_Menus");
        console.log("Procedure Definition:");
        console.log(rows[0]['Create Procedure']);
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

getSPDefinition();
