const db = require('./config/dbconnection');

const queries = [
    // 1. Add Template_ID column to Email_Logs
    "ALTER TABLE Email_Logs ADD COLUMN Template_ID INT AFTER Student_ID;",

    // 2. Drop and recreate Save_Email_Log SP
    "DROP PROCEDURE IF EXISTS Save_Email_Log;",
    "CREATE PROCEDURE Save_Email_Log(\n" +
    "    IN p_Student_ID INT,\n" +
    "    IN p_Template_ID INT,\n" +
    "    IN p_Email_Address VARCHAR(255),\n" +
    "    IN p_Subject VARCHAR(255),\n" +
    "    IN p_Body TEXT,\n" +
    "    IN p_Status VARCHAR(50),\n" +
    "    IN p_Error_Message TEXT\n" +
    ")\n" +
    "BEGIN\n" +
    "    INSERT INTO Email_Logs (Student_ID, Template_ID, Email_Address, Subject, Body, Status, Error_Message)\n" +
    "    VALUES (p_Student_ID, p_Template_ID, p_Email_Address, p_Subject, p_Body, p_Status, p_Error_Message);\n" +
    "    SELECT LAST_INSERT_ID() AS Log_ID;\n" +
    "END",

    // 3. Drop and recreate Get_Mail_Report SP
    "DROP PROCEDURE IF EXISTS Get_Mail_Report;",
    "CREATE PROCEDURE Get_Mail_Report()\n" +
    "BEGIN\n" +
    "    SELECT \n" +
    "        el.Log_ID,\n" +
    "        el.Sent_At,\n" +
    "        CONCAT(IFNULL(s.First_Name, ''), ' ', IFNULL(s.Last_Name, '')) AS Lead_Name,\n" +
    "        et.Template_Name AS Mail_Template,\n" +
    "        el.Email_Address,\n" +
    "        el.Subject,\n" +
    "        el.Status\n" +
    "    FROM Email_Logs el\n" +
    "    LEFT JOIN student s ON el.Student_ID = s.Student_ID\n" +
    "    LEFT JOIN email_templates et ON el.Template_ID = et.Template_ID\n" +
    "    ORDER BY el.Sent_At DESC;\n" +
    "END"
];

async function runQueries() {
    for (const query of queries) {
        try {
            await new Promise((resolve, reject) => {
                db.query(query, (err, results) => {
                    if (err) {
                        // Ignore error if column already exists (for ALTER TABLE)
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
