const db = require('./config/dbconnection');
const util = require('util');

async function testProcedureReturn() {
    console.log("Testing procedure return with UPDATE + SELECT...");
    const query = util.promisify(db.query).bind(db);
    try {
        await query(`
            CREATE PROCEDURE IF NOT EXISTS Test_Bug()
            BEGIN
                UPDATE users SET Device_ID = 'test' WHERE 1=0;
                SELECT 123 AS TestID;
            END
        `);
        
        const results = await query('CALL Test_Bug()');
        console.log("Full Results:", JSON.stringify(results, null, 2));
        
        await query('DROP PROCEDURE Test_Bug');
    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        db.end();
    }
}

testProcedureReturn();
