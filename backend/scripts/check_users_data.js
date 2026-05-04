const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "avies_db",
    multipleStatements: true,
};

async function checkUsers() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to DB.");

        const [rows] = await connection.query("SELECT User_ID, First_Name, Last_Name, Email, Delete_Status FROM users");
        console.log("Users in table:");
        console.log(JSON.stringify(rows, null, 2));

        await connection.end();
    } catch (e) {
        console.error("Error:", e);
        if (connection) await connection.end();
    }
}

checkUsers();
