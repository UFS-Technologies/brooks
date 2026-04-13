const mysql = require('mysql2/promise');
const dbConfig = { host: "localhost", user: "root", password: "password", database: "brooks_new", multipleStatements: true };

async function runSP() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query("CALL Get_Dashboard()");
        console.log("Result lengths:", rows.map(r => r.length));
        console.log("data[1]:", rows[1]);
        console.log("data[2]:", rows[2]);
        console.log("data[4]:", rows[4]);
        
        await connection.end();
    } catch (e) {
        console.error("SQL Error:", e);
        if (connection) await connection.end();
    }
}

runSP();
