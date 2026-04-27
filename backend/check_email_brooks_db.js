const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
};

async function checkEmailInBrooksDb() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query("SELECT * FROM menu WHERE Menu_Name = 'Email'");
        console.log("Email Menu in brooks_db:", rows);
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

checkEmailInBrooksDb();
