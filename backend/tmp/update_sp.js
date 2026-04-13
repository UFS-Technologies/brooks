const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_new",
    multipleStatements: true,
};

async function updateSP() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        const spDefinition = `
CREATE PROCEDURE Get_Dashboard()
BEGIN
    SELECT 
        a.account_id,
        a.account_name,
        a.total_value_a -
        COALESCE(b.total_value_b, 0) AS total_value_b
    FROM (
        SELECT 
            ah.account_id,
            ah.account_name,
            SUM(r.Amount) AS total_value_a
        FROM account_heads ah
        LEFT JOIN receipts r 
            ON ah.Account_Name = r.Account_Name
            AND (r.DeleteStatus IS NULL OR r.DeleteStatus = 0)
        GROUP BY ah.account_id, ah.account_name
    ) a
    LEFT JOIN (
        SELECT 
            ah.account_id,
            SUM(e.Amount) AS total_value_b
        FROM account_heads ah
        LEFT JOIN expense e 
            ON e.Account_Name = ah.Account_Name
            AND (e.Delete_Status IS NULL OR e.Delete_Status = 0)
        GROUP BY ah.account_id
    ) b ON a.account_id = b.account_id;

    SELECT 
        c.Course_Name,
        COUNT(sc.StudentCourse_ID) AS Enrollment_Count
    FROM course c
    LEFT JOIN student_course sc ON c.Course_ID = sc.Course_ID 
        AND (sc.Delete_Status IS NULL OR sc.Delete_Status = 0)
    WHERE (c.Delete_Status IS NULL OR c.Delete_Status = 0)
    GROUP BY c.Course_ID, c.Course_Name;

END;
`;
        await connection.query("DROP PROCEDURE IF EXISTS Get_Dashboard");
        await connection.query(spDefinition);
        
        console.log("Stored Procedure Get_Dashboard updated successfully.");
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

updateSP();
