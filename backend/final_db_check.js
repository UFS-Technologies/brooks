const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_new",
};

async function finalCheck() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to database.");

        const [menu] = await connection.query("SELECT * FROM menu WHERE Menu_Name = 'Email'");
        console.log("Menu Table Entry:", menu);

        if (menu.length > 0) {
            const [selection] = await connection.query("SELECT COUNT(*) as count FROM user_menu_selection WHERE Menu_Id = ? AND IsView = 1", [menu[0].Menu_ID]);
            console.log("Users with View Permission for Email:", selection[0].count);
            
            const [users] = await connection.query("SELECT COUNT(*) as count FROM users");
            console.log("Total Users in system:", users[0].count);
        }

        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

finalCheck();
