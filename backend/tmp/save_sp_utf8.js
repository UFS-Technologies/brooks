const mysql = require('mysql2/promise');
const fs = require('fs');
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
        const def = spCreate[0]['Create Procedure'];
        fs.writeFileSync('tmp/sp_dashboard_utf8.txt', def, 'utf8');
        console.log("Written to tmp/sp_dashboard_utf8.txt");
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

getSP();
