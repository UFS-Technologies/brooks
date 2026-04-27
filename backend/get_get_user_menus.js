const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_new",
};

async function getProcBody() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query(`
            SHOW CREATE PROCEDURE Get_user_Menus;
        `);
        if (rows.length > 0) {
            console.log("PROCEDURE Get_user_Menus:");
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

getProcBody();
