const mysql = require('mysql2/promise');
const axios = require('axios');
const dbConfig = { host: "localhost", user: "root", password: "password", database: "brooks_db" };

async function testAuthenticatedRoute() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [users] = await connection.query(
            `SELECT Email, password FROM users WHERE Delete_Status = 0 AND password IS NOT NULL LIMIT 1`
        );
        await connection.end();

        if (!users.length) { console.log("No users found"); return; }
        
        // Step 1: Login to get a token
        console.log("Step 1: Logging in...");
        const loginRes = await axios.post('http://localhost:3520/Login/Login_Check', {
            email: users[0].Email,
            password: users[0].password,
            Device_ID: '0'
        });
        const token = loginRes.data.token;
        console.log("Login success, token obtained.");

        // Step 2: Call a protected route
        console.log("\nStep 2: Calling a protected route with token...");
        try {
            const res = await axios.get('http://localhost:3520/user/Get_All_Menu', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Protected route SUCCESS! Status:", res.status);
        } catch (err) {
            if (err.response) {
                console.log("Protected route FAILURE! Status:", err.response.status);
                console.log("Headers:", err.response.headers['content-type']);
                console.log("Data:", JSON.stringify(err.response.data, null, 2));
            } else {
                console.error("Error:", err.message);
            }
        }
    } catch (e) {
        console.error("Outer error:", e.message);
        if (connection) await connection.end();
    }
}

testAuthenticatedRoute();
