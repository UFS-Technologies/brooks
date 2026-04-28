const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_new", // Default to brooks_new as seen in dbconnection.js
    multipleStatements: true,
};

async function updateTemplates() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to database:", dbConfig.database);

        // 1. Update email_templates table
        console.log("Updating email_templates...");
        
        // Replace 'IGM Academy' with 'Trackbox'
        await connection.query(`
            UPDATE email_templates 
            SET Body = REPLACE(Body, 'IGM Academy', 'Trackbox'),
                Subject = REPLACE(Subject, 'IGM Academy', 'Trackbox')
        `);
        
        // Replace 'IGM' with 'Trackbox'
        await connection.query(`
            UPDATE email_templates 
            SET Body = REPLACE(Body, 'IGM', 'Trackbox'),
                Subject = REPLACE(Subject, 'IGM', 'Trackbox')
        `);
        
        // Replace 'Innoglobal' with 'Trackbox'
        await connection.query(`
            UPDATE email_templates 
            SET Body = REPLACE(Body, 'Innoglobal', 'Trackbox'),
                Subject = REPLACE(Subject, 'Innoglobal', 'Trackbox')
        `);

        console.log("Database templates updated successfully.");
        
        // 2. Check current environment variables
        console.log("\n--- Environment Check ---");
        console.log("BREVO_SENDER_NAME:", process.env.BREVO_SENDER_NAME);
        console.log("BREVO_SENDER_EMAIL:", process.env.BREVO_SENDER_EMAIL);
        console.log("-------------------------\n");

        await connection.end();
    } catch (e) {
        console.error("Error updating templates:", e.message);
        if (connection) await connection.end();
    }
}

updateTemplates();
