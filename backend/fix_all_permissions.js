const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_new",
    multipleStatements: true,
};

async function fixPermissions() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to database.");

        const [menuRows] = await connection.query("SELECT Menu_ID FROM menu WHERE Route = '/admin/email-templates'");
        if (menuRows.length === 0) {
            console.log("Menu not found.");
            await connection.end();
            return;
        }
        const menuId = menuRows[0].Menu_ID;
        console.log("Menu ID:", menuId);

        // Get all users
        const [allUsers] = await connection.query("SELECT User_ID FROM users");
        console.log("Total Users:", allUsers.length);

        // Grant permissions to all users
        for (const user of allUsers) {
            await connection.query(`
                INSERT INTO user_menu_selection (Menu_Id, User_Id, IsEdit, IsSave, IsDelete, IsView, DeleteStatus)
                SELECT ?, ?, 1, 1, 1, 1, 0
                FROM DUAL
                WHERE NOT EXISTS (SELECT 1 FROM user_menu_selection WHERE Menu_Id = ? AND User_Id = ?);
            `, [menuId, user.User_ID, menuId, user.User_ID]);

            // Also ensure IsView is 1 even if it already exists
            await connection.query(`
                UPDATE user_menu_selection SET IsView = 1, DeleteStatus = 0 WHERE Menu_Id = ? AND User_Id = ?
            `, [menuId, user.User_ID]);
        }
        console.log("Permissions granted to all users.");

        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

fixPermissions();
