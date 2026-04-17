const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
    multipleStatements: true,
};

async function updateMenu() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        // 1. Insert Import into menu table if not exists
        const [insertMenu] = await connection.query(`
            INSERT INTO menu (Menu_Name, Route, Parent_Menu_ID, Delete_Status)
            SELECT 'Import', '/admin/Import', NULL, 0
            FROM DUAL
            WHERE NOT EXISTS (SELECT 1 FROM menu WHERE Route = '/admin/Import');
        `);
        console.log("Insert Menu Result:", insertMenu);

        // 2. Get the Menu_ID for Import
        const [menuRows] = await connection.query("SELECT Menu_ID FROM menu WHERE Route = '/admin/Import'");
        if (menuRows.length === 0) {
            console.error("Failed to find or create Import menu item.");
            return;
        }
        const importMenuId = menuRows[0].Menu_ID;
        console.log("Import Menu ID:", importMenuId);

        // 3. Find all users with User_Type_Id = 1 (Admin)
        const [adminUsers] = await connection.query("SELECT User_ID FROM users WHERE User_Type_Id = 1");
        console.log("Admin Users Found:", adminUsers.length);

        // 4. Give permission to all Admin users in user_menu_selection
        for (const user of adminUsers) {
            await connection.query(`
                INSERT INTO user_menu_selection (Menu_Id, User_Id, IsEdit, IsSave, IsDelete, IsView, DeleteStatus)
                SELECT ?, ?, 1, 1, 1, 1, 0
                FROM DUAL
                WHERE NOT EXISTS (SELECT 1 FROM user_menu_selection WHERE Menu_Id = ? AND User_Id = ?);
            `, [importMenuId, user.User_ID, importMenuId, user.User_ID]);
        }
        console.log("Permissions updated for admins.");

        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

updateMenu();
