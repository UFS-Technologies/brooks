const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "brooks_db",
};

async function checkMenus() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query("SELECT * FROM menu WHERE Menu_Name LIKE '%Enquiry%'");
        console.log("Enquiry related menus:");
        console.log(JSON.stringify(rows, null, 2));

        const [permissions] = await connection.query(`
            SELECT u.Email, m.Menu_Name 
            FROM user_menu_selection ums
            JOIN menu m ON ums.Menu_Id = m.Menu_ID
            JOIN users u ON ums.User_Id = u.User_ID
            WHERE m.Menu_Name LIKE '%Enquiry%'
        `);
        console.log("\nPermissions for enquiry menus:");
        console.log(JSON.stringify(permissions, null, 2));

        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

checkMenus();
