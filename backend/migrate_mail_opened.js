const db = require('./config/dbconnection');

const queries = [
    // 1. Add Message_ID and Opened_At columns to Email_Logs
    "ALTER TABLE Email_Logs ADD COLUMN Message_ID VARCHAR(255) AFTER Subject;",
    "ALTER TABLE Email_Logs ADD COLUMN Opened_At DATETIME AFTER Sent_At;",

    // 2. Drop and recreate Save_Email_Log SP to include Message_ID
    "DROP PROCEDURE IF EXISTS Save_Email_Log;",
    `CREATE PROCEDURE Save_Email_Log(
        IN p_Student_ID INT,
        IN p_Template_ID INT,
        IN p_Email_Address VARCHAR(255),
        IN p_Subject VARCHAR(255),
        IN p_Message_ID VARCHAR(255),
        IN p_Body TEXT,
        IN p_Status VARCHAR(50),
        IN p_Error_Message TEXT
    )
    BEGIN
        INSERT INTO Email_Logs (Student_ID, Template_ID, Email_Address, Subject, Message_ID, Body, Status, Error_Message)
        VALUES (p_Student_ID, p_Template_ID, p_Email_Address, p_Subject, p_Message_ID, p_Body, p_Status, p_Error_Message);
        SELECT LAST_INSERT_ID() AS Log_ID;
    END`,

    // 3. Drop and recreate Get_Mail_Report SP to include Message_ID and Opened_At
    "DROP PROCEDURE IF EXISTS Get_Mail_Report;",
    `CREATE PROCEDURE Get_Mail_Report(
        IN p_From_Date DATETIME,
        IN p_To_Date DATETIME,
        IN p_Template_ID INT
    )
    BEGIN
        SELECT 
            el.Log_ID,
            el.Sent_At,
            el.Opened_At,
            CONCAT(IFNULL(s.First_Name, ''), ' ', IFNULL(s.Last_Name, '')) AS Lead_Name,
            et.Template_Name AS Mail_Template,
            el.Email_Address,
            el.Subject,
            el.Message_ID,
            el.Status
        FROM Email_Logs el
        LEFT JOIN student s ON el.Student_ID = s.Student_ID
        LEFT JOIN email_templates et ON el.Template_ID = et.Template_ID
        WHERE 
            (p_From_Date IS NULL OR el.Sent_At >= p_From_Date) AND
            (p_To_Date IS NULL OR el.Sent_At <= p_To_Date) AND
            (p_Template_ID IS NULL OR el.Template_ID = p_Template_ID)
        ORDER BY el.Sent_At DESC;
    END`,

    // 4. Create Update_Email_Opened SP
    "DROP PROCEDURE IF EXISTS Update_Email_Opened;",
    `CREATE PROCEDURE Update_Email_Opened(
        IN p_Message_ID VARCHAR(255)
    )
    BEGIN
        UPDATE Email_Logs 
        SET Status = 'Opened', Opened_At = CURRENT_TIMESTAMP 
        WHERE Message_ID = p_Message_ID AND Status != 'Opened';
    END`
];

async function runQueries() {
    for (const query of queries) {
        try {
            await new Promise((resolve, reject) => {
                db.query(query, (err, results) => {
                    if (err) {
                        // Ignore error if column already exists
                        if (err.code === 'ER_DUP_FIELDNAME') {
                            resolve();
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve(results);
                    }
                });
            });
            console.log("Executed successfully:", query.substring(0, 50).replace(/\n/g, ' ') + "...");
        } catch (err) {
            console.error("Error executing query:", query.substring(0, 50).replace(/\n/g, ' '), err);
        }
    }
    db.end();
}

runQueries();
