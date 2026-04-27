const mysql = require('mysql2/promise');

async function checkMenus() {
    const dbs = ['brooks_new', 'brooks_db'];
    for (const dbName of dbs) {
        let connection;
        try {
            connection = await mysql.createConnection({
                host: "localhost",
                user: "root",
                password: "password",
                database: dbName
            });
            const [rows] = await connection.query("SELECT Menu_Name FROM menu");
            console.log(`Menus in ${dbName} (${rows.length}):`, rows.map(r => r.Menu_Name).join(', '));
            await connection.end();
        } catch (e) {
            console.log(`Failed to check ${dbName}: ${e.message}`);
        }
    }
}

checkMenus();
