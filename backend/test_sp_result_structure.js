const db = require('./config/dbconnection');
const StoredProcedure = require('./helpers/stored-procedure');

async function testResultStructure() {
    console.log("Testing StoredProcedure result structure...");
    try {
        // Use a simple query that returns a row
        const sp = new StoredProcedure('Login_Check', ['test@example.com', 'password', '0'], db);
        const result = await sp.result();
        console.log("Type of result:", typeof result);
        console.log("Is Array?", Array.isArray(result));
        console.log("Result value:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        db.end();
    }
}

testResultStructure();
