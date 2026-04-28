const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_new",
    multipleStatements: true,
};

async function fixEmailLogsDb() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to DB.");

        // 1. Add Template_ID column to Email_Logs if it doesn't exist
        try {
            await connection.query("ALTER TABLE Email_Logs ADD COLUMN Template_ID INT DEFAULT NULL AFTER Student_ID");
            console.log("Added Template_ID column to Email_Logs.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("Template_ID column already exists.");
            } else {
                throw e;
            }
        }

        // 2. Update Save_Email_Log procedure to handle 7 parameters
        await connection.query(`DROP PROCEDURE IF EXISTS Save_Email_Log;`);
        await connection.query(`
            CREATE PROCEDURE Save_Email_Log(
                IN p_Student_ID INT,
                IN p_Template_ID INT,
                IN p_Email_Address VARCHAR(255),
                IN p_Subject VARCHAR(255),
                IN p_Body TEXT,
                IN p_Status VARCHAR(50),
                IN p_Error_Message TEXT
            )
            BEGIN
                INSERT INTO Email_Logs (Student_ID, Template_ID, Email_Address, Subject, Body, Status, Error_Message)
                VALUES (p_Student_ID, p_Template_ID, p_Email_Address, p_Subject, p_Body, p_Status, p_Error_Message);
                SELECT LAST_INSERT_ID() AS Log_ID;
            END;
        `);
        console.log("Updated Save_Email_Log procedure.");

        // 3. Create Get_Mail_Report procedure
        await connection.query(`DROP PROCEDURE IF EXISTS Get_Mail_Report;`);
        await connection.query(`
            CREATE PROCEDURE Get_Mail_Report(
                IN p_FromDate DATETIME,
                IN p_ToDate DATETIME,
                IN p_TemplateID INT
            )
            BEGIN
                SELECT 
                    el.*,
                    s.First_Name as Lead_Name,
                    et.Template_Name as Mail_Template
                FROM Email_Logs el
                LEFT JOIN student s ON el.Student_ID = s.Student_ID
                LEFT JOIN email_templates et ON el.Template_ID = et.Template_ID
                WHERE (p_FromDate IS NULL OR el.Sent_At >= p_FromDate)
                  AND (p_ToDate IS NULL OR el.Sent_At <= p_ToDate)
                  AND (p_TemplateID IS NULL OR el.Template_ID = p_TemplateID)
                ORDER BY el.Sent_At DESC;
            END;
        `);
        console.log("Created Get_Mail_Report procedure.");

        await connection.end();
        console.log("Migration successful.");
    } catch (e) {
        console.error("Error during migration:", e);
        if (connection) await connection.end();
    }
}

fixEmailLogsDb();
