const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_new",
};

async function checkMenu() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to database.");

        const [menuRows] = await connection.query("SELECT * FROM menu WHERE Route = '/admin/email-templates'");
        console.log("Menu Entry:", menuRows);

        if (menuRows.length > 0) {
            const menuId = menuRows[0].Menu_ID;
            const [selectionRows] = await connection.query("SELECT * FROM user_menu_selection WHERE Menu_Id = ?", [menuId]);
            console.log("User Menu Selection Count:", selectionRows.length);
            
            const [adminUsers] = await connection.query("SELECT User_ID, User_Type_Id FROM users WHERE User_Type_Id = 1");
            console.log("Admin Users:", adminUsers);
        }

        await connection.end();
    } catch (e) {
        console.error("Error checking menu:", e);
        if (connection) await connection.end();
    }
}

checkMenu();
