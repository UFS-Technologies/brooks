const db = require('./config/dbconnection');
const util = require('util');

async function testConnection() {
    console.log("Testing DB connection...");
    try {
        const query = util.promisify(db.query).bind(db);
        const result = await query('SELECT 1');
        console.log("DB Connection successful:", result);

        console.log("Testing Login_Check procedure...");
        // Use a dummy email/password to see what happens
        try {
            const loginResult = await query('CALL Login_Check(?, ?, ?)', ['test@example.com', 'password', '0']);
            console.log("Login_Check call successful (even if no user found):", JSON.stringify(loginResult, null, 2));
        } catch (procError) {
            console.error("Login_Check procedure failed:", procError);
        }
    } catch (connectionError) {
        console.error("DB Connection failed:", connectionError);
    } finally {
        db.end();
    }
}

testConnection();
