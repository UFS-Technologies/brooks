const db = require('./config/dbconnection');

const queries = [
    // 1. Drop and recreate Get_Enquiry_Summary SP with filters
    `DROP PROCEDURE IF EXISTS Get_Enquiry_Summary;`,
    `CREATE PROCEDURE Get_Enquiry_Summary(
        IN p_From_Date DATETIME,
        IN p_To_Date DATETIME
    )
    BEGIN
        -- Result Set 1: Enquiry Sources
        SELECT Enquiry_Source_Id, Enquiry_Source_Name 
        FROM enquiry_source 
        WHERE IFNULL(Delete_Status, 0) = 0
        ORDER BY Enquiry_Source_Name;

        -- Result Set 2: Follow-up Statuses
        SELECT Status_Id, Status_Name, Status_Color
        FROM followup_status 
        WHERE IFNULL(Delete_Status, 0) = 0 AND Is_Active = 1
        ORDER BY Display_Order, Status_Name;

        -- Result Set 3: Counts per Source and Status
        -- Use Registered_On for date filtering
        SELECT 
            s.Enquiry_Source_Id, 
            fs.Status_Id, 
            COUNT(s.Student_ID) as LeadCount
        FROM student s
        JOIN (
            SELECT sf.Student_ID, sf.Follow_Up_Status_ID
            FROM student_followup sf
            WHERE sf.Follow_Up_ID = (
                SELECT sf2.Follow_Up_ID 
                FROM student_followup sf2 
                WHERE sf2.Student_ID = sf.Student_ID AND IFNULL(sf2.Delete_Status, 0) = 0
                ORDER BY sf2.Created_Date DESC, sf2.Follow_Up_ID DESC
                LIMIT 1
            )
        ) latest_fu ON s.Student_ID = latest_fu.Student_ID
        JOIN followup_status fs ON fs.Status_Id = latest_fu.Follow_Up_Status_ID
        WHERE s.Is_Registered = 0 
          AND IFNULL(s.Delete_Status, 0) = 0 
          AND IFNULL(fs.Delete_Status, 0) = 0
          AND (p_From_Date IS NULL OR s.Registered_On >= p_From_Date)
          AND (p_To_Date IS NULL OR s.Registered_On <= p_To_Date)
        GROUP BY s.Enquiry_Source_Id, fs.Status_Id;
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
