const db = require('./config/dbconnection');
const util = require('util');
const jwt = require('jsonwebtoken');

async function testFullLogin() {
    console.log("Testing full Login flow...");
    const query = util.promisify(db.query).bind(db);
    try {
        // 1. Login_Check
        console.log("Calling Login_Check...");
        const email = 'test@example.com';
        const password = 'password';
        const deviceId = '0';
        
        const loginRows = await query('CALL Login_Check(?, ?, ?)', [email, password, deviceId]);
        console.log("Login_Check result:", JSON.stringify(loginRows, null, 2));

        if (loginRows[0] && loginRows[0].length > 0) {
            const user = loginRows[0][0];
            console.log("User found:", user);

            // 2. JWT Sign (simulated)
            const token = 'fake-jwt-token';

            // 3. Insert_Login_User
            console.log("Calling Insert_Login_User...");
            // Based on Login.js: [userId, isStudent, userTypeId, token]
            const insertResult = await query('CALL Insert_Login_User(?, ?, ?, ?)', [
                user.Id,
                0,
                user.User_Type_Id,
                token
            ]);
            console.log("Insert_Login_User result:", JSON.stringify(insertResult, null, 2));
        } else {
            console.log("No user found for test credentials. Testing Insert_Login_User with dummy ID 1...");
            const insertResult = await query('CALL Insert_Login_User(?, ?, ?, ?)', [
                1,
                0,
                1,
                'dummy-token'
            ]);
            console.log("Insert_Login_User result (dummy):", JSON.stringify(insertResult, null, 2));
        }

    } catch (error) {
        console.error("Error during full login flow:", error);
    } finally {
        db.end();
    }
}

testFullLogin();
