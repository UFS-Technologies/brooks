const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_new",
    multipleStatements: true,
};

async function testGetMenu() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to database.");

        const userId = 129; // Hardcoded admin user ID from previous check
        const [results] = await connection.query("CALL Get_user_Menus(?)", [userId]);
        console.log("Get_user_Menus Results for user 129:", results[0]);

        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

testGetMenu();
