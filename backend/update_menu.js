const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
    multipleStatements: true,
};

async function getRows() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query("SELECT * FROM menu");
        console.log("menu ROWS", rows);
        await connection.end();
    } catch(e) {
        console.log(e);
        if(connection) await connection.end();
    }
}
getRows();
