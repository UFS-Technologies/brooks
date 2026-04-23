const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
    multipleStatements: true,
};

async function checkMenu() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query("SELECT * FROM menu WHERE Menu_Name = 'Enquiry Conversion' OR Route = '/admin/Enquiry_Conversion'");
        console.log("Menu rows:", JSON.stringify(rows, null, 2));
        
        if (rows.length > 0) {
            const menuId = rows[0].Menu_ID;
            const [permRows] = await connection.query("SELECT * FROM user_menu_selection WHERE Menu_Id = ?", [menuId]);
            console.log("Permission rows for menu ID " + menuId + ":", JSON.stringify(permRows, null, 2));
        } else {
            console.log("Menu not found.");
        }
        
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

checkMenu();
