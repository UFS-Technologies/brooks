const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
};

async function checkUserMenus() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [users] = await connection.query("SELECT User_ID FROM users WHERE Email = 'admin_user@G.COM'");
        if (users.length > 0) {
            const userId = users[0].User_ID;
            console.log(`User ID for admin_user@G.COM: ${userId}`);
            const [menus] = await connection.query(`
                SELECT m.Menu_Name, m.Route
                FROM menu m
                JOIN user_menu_selection ums ON m.Menu_ID = ums.Menu_Id
                WHERE ums.User_Id = ? AND ums.IsView = 1
            `, [userId]);
            console.log("Menus for user:");
            console.log(JSON.stringify(menus, null, 2));
        } else {
            console.log("User not found");
        }
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

checkUserMenus();
