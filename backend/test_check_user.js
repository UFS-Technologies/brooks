const mysql = require('mysql2/promise');
const axios = require('axios');
const dbConfig = { host: "localhost", user: "root", password: "password", database: "brooks_db" };

async function testCheckUser() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        // Step 1: Login to get a token
        const [users] = await connection.query(
            `SELECT Email, password, User_ID, User_Type_Id FROM users WHERE Delete_Status = 0 AND password IS NOT NULL LIMIT 1`
        );
        await connection.end();
        if (!users.length) { console.log("No users found"); return; }
        
        const loginRes = await axios.post('http://localhost:3520/Login/Login_Check', {
            email: users[0].Email,
            password: users[0].password,
            Device_ID: '0'
        });
        const token = loginRes.data.token;
        console.log("Token obtained:", token.substring(0, 20) + "...");

        // Step 2: Call check_User SP directly
        console.log("\nCalling check_User SP directly...");
        let conn2 = await mysql.createConnection(dbConfig);
        const [result] = await conn2.query('CALL check_User(?, ?, ?)', [users[0].User_ID, 0, token]);
        console.log("check_User result:", JSON.stringify(result, null, 2));
        await conn2.end();
    } catch (e) {
        console.error("Error:", e.message);
        if (connection) await connection.end();
    }
}

testCheckUser();
