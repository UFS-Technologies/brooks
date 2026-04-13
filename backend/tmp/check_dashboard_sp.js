const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_new",
    multipleStatements: true,
};

async function getSP() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [spCreate] = await connection.query("SHOW CREATE PROCEDURE Get_Dashboard");
        console.log("SP:", spCreate[0]['Create Procedure']);
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

getSP();
