const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_new",
    multipleStatements: true,
};

async function listTables() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query("SHOW TABLES");
        console.log("Tables:", JSON.stringify(rows.map(r => Object.values(r)[0]), null, 2));
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

listTables();
