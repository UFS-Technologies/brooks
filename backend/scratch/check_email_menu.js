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
        
        const [menuRows] = await connection.query("SELECT * FROM menu WHERE Menu_Name = 'Email' OR Route = '/admin/email-templates'");
        console.log("Email Menu:", menuRows);

        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

checkMenu();
