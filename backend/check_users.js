const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
};

async function checkUserTypes() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to database.");

        const [users] = await connection.query("SELECT User_ID, Email, password, User_Type_Id FROM users WHERE Delete_Status = 0 LIMIT 10");
        console.log("Recent Users:", users);

        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

checkUserTypes();
