const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "avies_db",
    multipleStatements: true,
};

async function testSearchUser() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to DB.");

        const [results] = await connection.query("CALL Search_User('', NULL, NULL, 0, NULL)");
        console.log("First user object:");
        console.log(JSON.stringify(results[0][0], null, 2));

        await connection.end();
    } catch (e) {
        console.error("Error:", e);
        if (connection) await connection.end();
    }
}

testSearchUser();
