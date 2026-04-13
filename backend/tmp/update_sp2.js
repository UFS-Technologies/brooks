const mysql = require('mysql2/promise');
const dbConfig = { host: "localhost", user: "root", password: "password", database: "brooks_new", multipleStatements: true };

async function updateSP() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        const spDefinition = `
CREATE PROCEDURE Get_Dashboard()
BEGIN
    -- 1. Accounts Summary
    SELECT 
        a.account_id,
        a.account_name,
        a.total_value_a - COALESCE(b.total_value_b, 0) AS total_value_b
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

    -- 2. Popular Course
    SELECT 
        c.Course_Name,
        COUNT(sc.StudentCourse_ID) AS Enrollment_Count
    FROM course c
    LEFT JOIN student_course sc ON c.Course_ID = sc.Course_ID 
        AND (sc.Delete_Status IS NULL OR sc.Delete_Status = 0)
    WHERE (c.Delete_Status IS NULL OR c.Delete_Status = 0)
    GROUP BY c.Course_ID, c.Course_Name
    ORDER BY Enrollment_Count DESC
    LIMIT 10;

    -- 3. Month Wise Student Enrollment
    SELECT 
        MONTHNAME(Admission_Date) AS Month,
        COUNT(Student_ID) AS Student_Count
    FROM student
    WHERE Is_Registered = 1 
      AND Admission_Date IS NOT NULL 
    GROUP BY MONTHNAME(Admission_Date), MONTH(Admission_Date)
    ORDER BY MONTH(Admission_Date);

    -- 4. Course Wise Monthly Enrollment
    SELECT 
        c.Course_Name, 
        MONTHNAME(sc.Enrollment_Date) AS Month,
        COUNT(sc.StudentCourse_ID) AS Student_Count
    FROM course c
    INNER JOIN student_course sc ON c.Course_ID = sc.Course_ID 
        AND (sc.Delete_Status IS NULL OR sc.Delete_Status = 0)
        AND sc.Enrollment_Date IS NOT NULL
    WHERE (c.Delete_Status IS NULL OR c.Delete_Status = 0)
    GROUP BY c.Course_ID, c.Course_Name, MONTHNAME(sc.Enrollment_Date), MONTH(sc.Enrollment_Date)
    ORDER BY c.Course_Name, MONTH(sc.Enrollment_Date);

    -- 5. Month Wise Lead Report
    SELECT 
        MONTHNAME(Entry_Date) AS Month,
        COUNT(Student_ID) AS Lead_Count
    FROM student
    WHERE Is_Registered = 0 
      AND Entry_Date IS NOT NULL 
    GROUP BY MONTHNAME(Entry_Date), MONTH(Entry_Date)
    ORDER BY MONTH(Entry_Date);

    -- 6. Student Status Representation
    SELECT 
        CASE 
            WHEN isActive = 1 THEN 'Active'
            WHEN isActive = 0 AND Status_Name = 'Dropout' THEN 'Dropout'
            ELSE 'Completed' 
        END AS Status,
        COUNT(Student_ID) AS Count
    FROM student
    WHERE Is_Registered = 1
    GROUP BY Status;
    
END;
`;
        await connection.query("DROP PROCEDURE IF EXISTS Get_Dashboard");
        await connection.query(spDefinition);
        
        console.log("Stored Procedure Get_Dashboard updated with all 6 result sets.");
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

updateSP();
