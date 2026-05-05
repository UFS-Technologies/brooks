const db = require('./config/dbconnection');

async function setup() {
    try {
        console.log("Connected to database.");

        // 1. Insert Campaign menu into menu table if not exists
        const [insertMenu] = await new Promise((resolve, reject) => {
            db.query(`
                INSERT INTO menu (Menu_Name, Route, Parent_Menu_ID, Delete_Status)
                SELECT 'Campaign', 'Campaign', NULL, 0
                FROM DUAL
                WHERE NOT EXISTS (SELECT 1 FROM menu WHERE Menu_Name = 'Campaign');
            `, (err, results) => {
                if (err) reject(err);
                else resolve([results]);
            });
        });
        console.log("Insert Menu Result:", insertMenu);

        // 2. Get the Menu_ID for Campaign
        const menuRows = await new Promise((resolve, reject) => {
            db.query("SELECT Menu_ID FROM menu WHERE Menu_Name = 'Campaign'", (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        if (menuRows.length === 0) {
            console.error("Failed to find Campaign menu after insertion");
            process.exit(1);
        }
        const campaignMenuId = menuRows[0].Menu_ID;
        console.log("Campaign Menu ID:", campaignMenuId);

        // 3. Find all users with User_Type_Id = 1 (Admin)
        const adminUsers = await new Promise((resolve, reject) => {
            db.query("SELECT User_ID FROM users WHERE User_Type_Id = 1 AND Delete_Status = 0", (err, results) => {
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
                `, [campaignMenuId, user.User_ID, campaignMenuId, user.User_ID], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
        }
        console.log("Permissions updated for admins.");

        console.log("Setup completed successfully.");
        process.exit(0);
    } catch (e) {
        console.error("Error during setup:", e);
        process.exit(1);
    }
}

setup();
