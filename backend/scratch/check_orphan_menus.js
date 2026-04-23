const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
};

async function checkOrphanMenus() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        // Check for admin user (usually ID 1)
        const [adminRows] = await connection.query("SELECT User_ID FROM users WHERE User_Type_Id = 1 LIMIT 1");
        if (adminRows.length === 0) {
            console.log("No admin user found.");
            await connection.end();
            return;
        }
        const adminId = adminRows[0].User_ID;
        console.log("Checking for admin ID:", adminId);

        const [rows] = await connection.query(`
            SELECT Menu_Name 
            FROM menu m
            WHERE NOT EXISTS (
                SELECT 1 FROM user_menu_selection ums 
                WHERE ums.Menu_ID = m.Menu_ID AND ums.User_Id = ?
            )
            AND m.Delete_Status = 0
        `, [adminId]);
        
        console.log("Menus missing permission for admin " + adminId + ":");
        console.log(rows.map(r => r.Menu_Name));
        
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

checkOrphanMenus();
