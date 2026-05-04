const db = require('./config/dbconnection');

async function fixMenu() {
    try {
        console.log("Fixing 'Mail Report' menu...");
        
        // 1. Insert into menu table
        const insertMenuQuery = `
            INSERT INTO menu (Menu_Name, Route, Parent_Menu_ID, Delete_Status)
            VALUES ('Mail Report', '/admin/Mail_Report', NULL, 0)
            ON DUPLICATE KEY UPDATE Route = '/admin/Mail_Report', Delete_Status = 0;
        `;
        
        // Check if it exists first to handle cases where ON DUPLICATE KEY might not work as expected with unique constraints
        const existingMenu = await new Promise((resolve, reject) => {
            db.query("SELECT Menu_ID FROM menu WHERE Menu_Name = 'Mail Report'", (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        let menuId;
        if (existingMenu.length === 0) {
            const result = await new Promise((resolve, reject) => {
                db.query("INSERT INTO menu (Menu_Name, Route, Parent_Menu_ID, Delete_Status) VALUES ('Mail Report', '/admin/Mail_Report', NULL, 0)", (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            menuId = result.insertId;
            console.log("✅ Created 'Mail Report' menu with ID:", menuId);
        } else {
            menuId = existingMenu[0].Menu_ID;
            await new Promise((resolve, reject) => {
                db.query("UPDATE menu SET Route = '/admin/Mail_Report', Delete_Status = 0 WHERE Menu_ID = ?", [menuId], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            console.log("✅ Updated existing 'Mail Report' menu with ID:", menuId);
        }

        // 2. Assign to all Admin users (User_Type_Id = 1)
        const admins = await new Promise((resolve, reject) => {
            db.query("SELECT User_ID FROM users WHERE User_Type_Id = 1", (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        console.log(`Found ${admins.length} Admin users.`);
        
        for (const admin of admins) {
            await new Promise((resolve, reject) => {
                db.query(`
                    INSERT INTO user_menu_selection (Menu_Id, User_Id, IsEdit, IsSave, IsDelete, IsView, DeleteStatus)
                    VALUES (?, ?, 1, 1, 1, 1, 0)
                    ON DUPLICATE KEY UPDATE DeleteStatus = 0, IsView = 1;
                `, [menuId, admin.User_ID], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
        }
        
        console.log("✅ Assigned menu to all Admin users.");
        
        db.end();
    } catch (e) {
        console.error("Error fixing menu:", e);
        db.end();
    }
}

fixMenu();
