const db = require('./config/dbconnection');

const queries = [
    // 1. Drop and recreate Get_Mail_Report SP with filters
    `DROP PROCEDURE IF EXISTS Get_Mail_Report;`,
    `CREATE PROCEDURE Get_Mail_Report(
        IN p_From_Date DATETIME,
        IN p_To_Date DATETIME,
        IN p_Template_ID INT
    )
    BEGIN
        SELECT 
            el.Log_ID,
            el.Sent_At,
            CONCAT(IFNULL(s.First_Name, ''), ' ', IFNULL(s.Last_Name, '')) AS Lead_Name,
            et.Template_Name AS Mail_Template,
            el.Email_Address,
            el.Subject,
            el.Status
        FROM Email_Logs el
        LEFT JOIN student s ON el.Student_ID = s.Student_ID
        LEFT JOIN email_templates et ON el.Template_ID = et.Template_ID
        WHERE 
            (p_From_Date IS NULL OR el.Sent_At >= p_From_Date) AND
            (p_To_Date IS NULL OR el.Sent_At <= p_To_Date) AND
            (p_Template_ID IS NULL OR el.Template_ID = p_Template_ID)
        ORDER BY el.Sent_At DESC;
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
            console.log("Executed successfully:", query.substring(0, 50).replace(/\n/g, ' ') + "...");
        } catch (err) {
            console.error("Error executing query:", query.substring(0, 50).replace(/\n/g, ' '), err);
        }
    }
    db.end();
}

runQueries();
