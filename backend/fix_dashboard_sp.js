const mysql = require('mysql2/promise');
const connection = require('./config/dbconnection');

async function fixDashboardSP() {
    let pool;
    try {
        console.log("Connecting to database...");
        // Use the pool from dbconnection
        const [rows] = await connection.promise().query("SELECT 1");
        console.log("Connection successful.");

        const dropSP = "DROP PROCEDURE IF EXISTS `Get_Dashboard`;";
        const createSP = `
CREATE PROCEDURE \`Get_Dashboard\`()
BEGIN
    -- 1. Accounts Summary
    SELECT 
        a.account_id,
        a.account_name,
        a.total_value_a - COALESCE(b.total_value_b, 0) AS total_value_b
    FROM (
        SELECT ah.account_id, ah.account_name, SUM(r.Amount) AS total_value_a
        FROM account_heads ah
        LEFT JOIN receipts r ON ah.Account_Name = r.Account_Name AND (r.DeleteStatus IS NULL OR r.DeleteStatus = 0)
        GROUP BY ah.account_id, ah.account_name
    ) a
    LEFT JOIN (
        SELECT ah.account_id, SUM(e.Amount) AS total_value_b
        FROM account_heads ah
        LEFT JOIN expense e ON e.Account_Name = ah.Account_Name AND (e.Delete_Status IS NULL OR e.Delete_Status = 0)
        GROUP BY ah.account_id
    ) b ON a.account_id = b.account_id;

    -- 2. Popular Course
    SELECT 
        c.Course_Name, 
        COUNT(sc.StudentCourse_ID) AS Enrollment_Count
    FROM course c
    LEFT JOIN student_course sc ON c.Course_ID = sc.Course_ID AND IFNULL(sc.Delete_Status, 0) = 0
    WHERE IFNULL(c.Delete_Status, 0) = 0
    GROUP BY c.Course_ID, c.Course_Name
    ORDER BY Enrollment_Count DESC
    LIMIT 10;

    -- 3. Month Wise Student Enrollment (Current Year)
    SELECT 
        MONTHNAME(COALESCE(sc.Enrollment_Date, s.Admission_Date)) AS Month,
        COUNT(DISTINCT s.Student_ID) AS Student_Count
    FROM student s
    JOIN student_course sc ON s.Student_ID = sc.Student_ID
    WHERE IFNULL(s.Delete_Status, 0) = 0
      AND IFNULL(sc.Delete_Status, 0) = 0
      AND COALESCE(sc.Enrollment_Date, s.Admission_Date) IS NOT NULL
      AND YEAR(COALESCE(sc.Enrollment_Date, s.Admission_Date)) = YEAR(CURDATE())
    GROUP BY Month
    ORDER BY MONTH(STR_TO_DATE(CONCAT('01 ', Month, ' ', YEAR(CURDATE())), '%d %M %Y'));

    -- 4. DUMMY (Expected as data[3], will be overwritten by backend JS)
    SELECT 1 AS Dummy;

    -- 5. Month Wise Lead Report (Current Year)
    SELECT 
        MONTHNAME(COALESCE(Entry_Date, Admission_Date)) AS Month,
        COUNT(Student_ID) AS Lead_Count
    FROM student
    WHERE IFNULL(Delete_Status, 0) = 0 
      AND COALESCE(Entry_Date, Admission_Date) IS NOT NULL
      AND IFNULL(Is_Registered, 0) = 0
      AND YEAR(COALESCE(Entry_Date, Admission_Date)) = YEAR(CURDATE())
    GROUP BY Month
    ORDER BY MONTH(STR_TO_DATE(CONCAT('01 ', Month, ' ', YEAR(CURDATE())), '%d %M %Y'));

    -- 6. Student Status Representation (Categorized for Registered Students)
    SELECT 
        CASE 
            WHEN LOWER(Status_Name) = 'completed' THEN 'Completed'
            WHEN LOWER(Status_Name) IN ('dropout', 'deactivated') THEN 'Dropout'
            WHEN isActive = 1 THEN 'Active'
            ELSE 'Dropout'
        END AS Status, 
        CAST(COUNT(Student_ID) AS UNSIGNED) AS Count
    FROM student
    WHERE IFNULL(Delete_Status, 0) = 0
      AND Is_Registered = 1
    GROUP BY Status;

END;`;

        await connection.promise().query(dropSP);
        console.log("Old procedure dropped.");
        
        await connection.promise().query(createSP);
        console.log("New procedure created with all result sets.");

    } catch (error) {
        console.error("Error updating stored procedure:", error);
    } finally {
        // Pool will be closed by process end or we can leave it
        process.exit();
    }
}

fixDashboardSP();
