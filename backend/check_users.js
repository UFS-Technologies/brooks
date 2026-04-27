const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_new",
};

async function checkUserTypes() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to database.");

        const [types] = await connection.query("SELECT * FROM user_type");
        console.log("User Types:", types);

        const [users] = await connection.query("SELECT User_ID, Email, User_Type_Id FROM users LIMIT 10");
        console.log("Recent Users:", users);

        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

checkUserTypes();
