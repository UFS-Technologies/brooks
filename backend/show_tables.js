const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
    multipleStatements: true,
};

async function getTables() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [tables] = await connection.query("SHOW TABLES");
        console.log(tables.map(t => Object.values(t)[0]));
        await connection.end();
    } catch(e) {
        console.error(e);
        if(connection) await connection.end();
    }
}
getTables();
