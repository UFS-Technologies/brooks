const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_new",
};

async function checkPermissions() {
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

        const [selectionRows] = await connection.query(`
            SELECT ums.*, u.Email, u.User_Type_Id 
            FROM user_menu_selection ums
            JOIN users u ON ums.User_Id = u.User_ID
            WHERE ums.Menu_Id = ?
        `, [menuId]);
        
        console.log("Permissions for Menu:", selectionRows);

        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

checkPermissions();
