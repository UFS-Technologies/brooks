const fs = require('fs');
const mysql = require('mysql2/promise');

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "aives_db",
    multipleStatements: true,
};

async function applyCallLogSP() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log("Connected to aives_db.");

        const sql = fs.readFileSync('Save_Call_Log_definition.sql', 'utf8');
        
        // Execute the script
        // Note: multipleStatements is true in config, so we can run the whole file
        await connection.query(sql);
        
        console.log("Save_Call_Log table and stored procedure applied successfully.");
        await connection.end();
    } catch (e) {
        console.error("Error applying Call Log SP:", e);
        process.exit(1);
    }
}

applyCallLogSP();
