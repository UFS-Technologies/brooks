const db = require('./config/dbconnection');

async function checkMenu() {
    try {
        console.log("Checking for 'Mail Report' menu...");
        
        // Check menu table
        const menuItems = await new Promise((resolve, reject) => {
            db.query("SELECT * FROM menu WHERE Menu_Name = 'Mail Report'", (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
        
        if (menuItems.length === 0) {
            console.log("❌ 'Mail Report' menu NOT found in 'menu' table.");
        } else {
            console.log("✅ 'Mail Report' menu found:", menuItems[0]);
            
            const menuId = menuItems[0].Menu_ID;
            
            // Check user_menu_selection table
            const selections = await new Promise((resolve, reject) => {
                db.query("SELECT ums.*, u.First_Name, u.Last_Name FROM user_menu_selection ums JOIN users u ON ums.User_Id = u.User_Id WHERE ums.Menu_Id = ?", [menuId], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            if (selections.length === 0) {
                console.log("❌ 'Mail Report' menu NOT assigned to any users in 'user_menu_selection' table.");
            } else {
                console.log(`✅ 'Mail Report' menu assigned to ${selections.length} users.`);
            }
        }
        
        db.end();
    } catch (e) {
        console.error("Error checking menu:", e);
        db.end();
    }
}

checkMenu();
