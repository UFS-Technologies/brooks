const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
};

async function checkBrooksDb() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to brooks_db.");

        const [rows] = await connection.query("SELECT Menu_Name, Route FROM menu");
        console.log("Menus in brooks_db:", rows);

        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

checkBrooksDb();
