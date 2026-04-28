const db = require('./config/dbconnection');

const createTableQuery = `
CREATE TABLE IF NOT EXISTS Email_Logs (
    Log_ID INT AUTO_INCREMENT PRIMARY KEY,
    Student_ID INT,
    Email_Address VARCHAR(255),
    Subject VARCHAR(255),
    Body TEXT,
    Sent_At DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status VARCHAR(50),
    Error_Message TEXT
);
`;

const createSaveSPQuery = `
CREATE PROCEDURE Save_Email_Log(
    IN p_Student_ID INT,
    IN p_Email_Address VARCHAR(255),
    IN p_Subject VARCHAR(255),
    IN p_Body TEXT,
    IN p_Status VARCHAR(50),
    IN p_Error_Message TEXT
)
BEGIN
    INSERT INTO Email_Logs (Student_ID, Email_Address, Subject, Body, Status, Error_Message)
    VALUES (p_Student_ID, p_Email_Address, p_Subject, p_Body, p_Status, p_Error_Message);
    SELECT LAST_INSERT_ID() AS Log_ID;
END
`;

const createGetSPQuery = `
CREATE PROCEDURE Get_Email_Logs_By_Student(
    IN p_Student_ID INT
)
BEGIN
    SELECT * FROM Email_Logs WHERE Student_ID = p_Student_ID ORDER BY Sent_At DESC;
END
`;

const dropSaveSPQuery = `DROP PROCEDURE IF EXISTS Save_Email_Log;`;
const dropGetSPQuery = `DROP PROCEDURE IF EXISTS Get_Email_Logs_By_Student;`;

db.query(createTableQuery, (err) => {
    if (err) {
        console.error("Error creating Email_Logs table:", err);
        process.exit(1);
    }
    console.log("Email_Logs table created or already exists.");

    db.query(dropSaveSPQuery, (err) => {
        db.query(createSaveSPQuery, (err) => {
            if (err) console.error("Error creating Save_Email_Log SP:", err);
            else console.log("Save_Email_Log SP created.");

            db.query(dropGetSPQuery, (err) => {
                db.query(createGetSPQuery, (err) => {
                    if (err) console.error("Error creating Get_Email_Logs_By_Student SP:", err);
                    else console.log("Get_Email_Logs_By_Student SP created.");
                    
                    db.end();
                });
            });
        });
    });
});
