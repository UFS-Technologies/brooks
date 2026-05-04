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
        console.log("Results from Search_User (with course_id=0):");
        console.log("Count:", results[0].length);
        if (results[0].length > 0) {
            console.log("First user:", results[0][0].First_Name);
        }

        await connection.end();
    } catch (e) {
        console.error("Error:", e);
        if (connection) await connection.end();
    }
}

testSearchUser();
