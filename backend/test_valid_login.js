const mysql = require('mysql2/promise');
const axios = require('axios');

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
};

async function testValidLogin() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        // Get a real user with a known password
        const [rows] = await connection.query(
            `SELECT Email, password, User_Type_Id FROM users WHERE Delete_Status = 0 AND password IS NOT NULL AND password != '' LIMIT 1`
        );
        await connection.end();

        if (rows.length === 0) {
            console.log("No users found in the database.");
            return;
        }

        const user = rows[0];
        console.log("Testing with user:", user.Email);
        console.log("User_Type_Id:", user.User_Type_Id);

        try {
            const response = await axios.post('http://localhost:3520/Login/Login_Check', {
                email: user.Email,
                password: user.password,
                Device_ID: '0'
            });
            console.log("SUCCESS! Status:", response.status);
            console.log("Response keys:", Object.keys(response.data));
        } catch (error) {
            if (error.response) {
                console.log("FAILURE! Status:", error.response.status);
                console.log("Headers:", error.response.headers['content-type']);
                console.log("Data:", JSON.stringify(error.response.data, null, 2));
            } else {
                console.error("Error:", error.message);
            }
        }
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

testValidLogin();
