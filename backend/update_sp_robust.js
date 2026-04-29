const db = require('./config/dbconnection');

const queries = [
    "DROP PROCEDURE IF EXISTS Update_Email_Opened;",
    `CREATE PROCEDURE Update_Email_Opened(
        IN p_Message_ID VARCHAR(255)
    )
    BEGIN
        UPDATE Email_Logs 
        SET Status = 'Opened', Opened_At = CURRENT_TIMESTAMP 
        WHERE (
            Message_ID = p_Message_ID 
            OR Message_ID = CONCAT('<', p_Message_ID, '>') 
            OR REPLACE(REPLACE(Message_ID, '<', ''), '>', '') = REPLACE(REPLACE(p_Message_ID, '<', ''), '>', '')
        )
        AND Status != 'Opened';
    END`
];

async function runQueries() {
    for (const query of queries) {
        try {
            await new Promise((resolve, reject) => {
                db.query(query, (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            console.log("Executed successfully");
        } catch (err) {
            console.error("Error executing query:", err);
        }
    }
    db.end();
}

runQueries();
