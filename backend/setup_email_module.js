const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_new",
    multipleStatements: true,
};

async function setup() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to database.");

        // 1. Create email_templates table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS email_templates (
                Template_ID INT AUTO_INCREMENT PRIMARY KEY,
                Template_Name VARCHAR(255) NOT NULL,
                Subject VARCHAR(255) NOT NULL,
                Body TEXT NOT NULL,
                Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                Delete_Status TINYINT DEFAULT 0
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("email_templates table created or already exists.");

        // 2. Insert Email menu into menu table if not exists
        const [insertMenu] = await connection.query(`
            INSERT INTO menu (Menu_Name, Route, Parent_Menu_ID, Delete_Status)
            SELECT 'Email', '/admin/email-templates', NULL, 0
            FROM DUAL
            WHERE NOT EXISTS (SELECT 1 FROM menu WHERE Route = '/admin/email-templates');
        `);
        console.log("Insert Menu Result:", insertMenu);

        // 3. Get the Menu_ID for Email
        const [menuRows] = await connection.query("SELECT Menu_ID FROM menu WHERE Route = '/admin/email-templates'");
        if (menuRows.length === 0) {
            console.error("Failed to find Email menu after insertion");
            await connection.end();
            return;
        }
        const emailMenuId = menuRows[0].Menu_ID;
        console.log("Email Menu ID:", emailMenuId);

        // 4. Find all users with User_Type_Id = 1 (Admin)
        const [adminUsers] = await connection.query("SELECT User_ID FROM users WHERE User_Type_Id = 1");
        console.log("Admin Users Found:", adminUsers.length);

        // 5. Give permission to all Admin users in user_menu_selection
        for (const user of adminUsers) {
            await connection.query(`
                INSERT INTO user_menu_selection (Menu_Id, User_Id, IsEdit, IsSave, IsDelete, IsView, DeleteStatus)
                SELECT ?, ?, 1, 1, 1, 1, 0
                FROM DUAL
                WHERE NOT EXISTS (SELECT 1 FROM user_menu_selection WHERE Menu_Id = ? AND User_Id = ?);
            `, [emailMenuId, user.User_ID, emailMenuId, user.User_ID]);
        }
        console.log("Permissions updated for admins.");

        await connection.end();
        console.log("Setup completed successfully.");
    } catch (e) {
        console.error("Error during setup:", e);
        if (connection) await connection.end();
    }
}

setup();
