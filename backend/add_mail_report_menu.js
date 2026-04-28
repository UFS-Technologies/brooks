const db = require('./config/dbconnection');

async function setup() {
    try {
        console.log("Connected to database.");

        // 1. Insert Mail Report menu into menu table if not exists
        const [insertMenu] = await new Promise((resolve, reject) => {
            db.query(`
                INSERT INTO menu (Menu_Name, Route, Parent_Menu_ID, Delete_Status)
                SELECT 'Mail Report', '/admin/Mail_Report', NULL, 0
                FROM DUAL
                WHERE NOT EXISTS (SELECT 1 FROM menu WHERE Route = '/admin/Mail_Report');
            `, (err, results) => {
                if (err) reject(err);
                else resolve([results]);
            });
        });
        console.log("Insert Menu Result:", insertMenu);

        // 2. Get the Menu_ID for Mail Report
        const menuRows = await new Promise((resolve, reject) => {
            db.query("SELECT Menu_ID FROM menu WHERE Route = '/admin/Mail_Report'", (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        if (menuRows.length === 0) {
            console.error("Failed to find Mail Report menu after insertion");
            db.end();
            return;
        }
        const mailReportMenuId = menuRows[0].Menu_ID;
        console.log("Mail Report Menu ID:", mailReportMenuId);

        // 3. Find all users with User_Type_Id = 1 (Admin)
        const adminUsers = await new Promise((resolve, reject) => {
            db.query("SELECT User_ID FROM users WHERE User_Type_Id = 1", (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        console.log("Admin Users Found:", adminUsers.length);

        // 4. Give permission to all Admin users in user_menu_selection
        for (const user of adminUsers) {
            await new Promise((resolve, reject) => {
                db.query(`
                    INSERT INTO user_menu_selection (Menu_Id, User_Id, IsEdit, IsSave, IsDelete, IsView, DeleteStatus)
                    SELECT ?, ?, 1, 1, 1, 1, 0
                    FROM DUAL
                    WHERE NOT EXISTS (SELECT 1 FROM user_menu_selection WHERE Menu_Id = ? AND User_Id = ?);
                `, [mailReportMenuId, user.User_ID, mailReportMenuId, user.User_ID], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
        }
        console.log("Permissions updated for admins.");

        db.end();
        console.log("Setup completed successfully.");
    } catch (e) {
        console.error("Error during setup:", e);
        db.end();
    }
}

setup();
