const fs = require('fs');
const db = require('./config/dbconnection');

const sql = `
CREATE PROCEDURE \`Search_student\`(
    IN search_term VARCHAR(100),
    IN page_number INT,
    IN page_size INT,
    IN filter_course_id INT,
    IN filter_batch_id INT,
    IN enrollment_status VARCHAR(50),
    IN active_status VARCHAR(20)
)
BEGIN
    DECLARE offset_value INT;
    SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''));
    SET search_term = CONCAT('%', search_term, '%');
    SET offset_value = (page_number - 1) * page_size;

    IF enrollment_status IS NULL THEN SET enrollment_status = 'all'; END IF;
    IF active_status IS NULL THEN SET active_status = 'all'; END IF;

    SELECT COUNT(DISTINCT s.Student_ID) AS total_count
    FROM student s
    LEFT JOIN student_course sc ON s.Student_ID = sc.Student_ID
    LEFT JOIN course_batch cb ON sc.Batch_ID = cb.Batch_ID
    WHERE
        (s.First_Name LIKE search_term OR s.Last_Name LIKE search_term OR s.Email LIKE search_term OR
         s.Phone_Number LIKE search_term OR CONCAT(s.First_Name, ' ', s.Last_Name) LIKE search_term OR
         CONCAT(s.Last_Name, ' ', s.First_Name) LIKE search_term OR
         s.Roll_No LIKE search_term
         )
        AND s.Delete_Status = false
        AND (filter_course_id IS NULL OR sc.Course_ID = filter_course_id)
        AND (filter_batch_id IS NULL OR cb.Batch_ID = filter_batch_id)
      AND (
    (enrollment_status = 'enrolled' AND s.Is_Registered = 0) OR
    (enrollment_status = 'not_enrolled' AND s.Is_Registered = 1) OR
    (enrollment_status = 'all')
)
        AND (
            (active_status = 'active' AND s.isActive = 1) OR
            (active_status = 'deactivated' AND s.isActive = 0) OR
            (active_status = 'all')
        );

    SELECT
                s.Student_ID,
                s.First_Name,
                s.Last_Name,
                s.Email,
                s.Country_Code,
                s.Phone_Number,
                s.Profile_Photo_Path,
                s.Profile_Photo_Name,
        s.Branch_Id,
                s.Branch_Name,
                s.Status_Name,
                s.To_User_Name,
                s.Qualification,
                s.Follow_Up_Date,
                s.Remark,
                s.isActive,
                s.Is_Registered,
                s.Roll_No,
                s.Entry_Date,
                s.Registered_On,
                s.Delete_Status,
        s.Admission_Date,
        s.Enquiry_Source_Id,
        s.Guardian_Type,
        s.Guardian_Name,
            s.Address,
        MAX(c.Course_Name) AS Course_Name,
        MAX(cb.Batch_Name) AS Batch_Name,
        CASE
            WHEN EXISTS (
                SELECT 1
                FROM student_course sc
                JOIN course c ON sc.Course_ID = c.Course_ID
                WHERE sc.Student_ID = s.Student_ID
                AND sc.Delete_Status = false
                AND c.Delete_Status = 0
            ) THEN true
            ELSE false
        END AS is_enrolled
    FROM
        student s
    LEFT JOIN student_course sc ON s.Student_ID = sc.Student_ID
    LEFT JOIN course c ON sc.Course_ID = c.Course_ID
    LEFT JOIN course_batch cb ON sc.Batch_ID = cb.Batch_ID
    WHERE
    s.Is_Registered = 1 AND
        (s.First_Name LIKE search_term OR s.Last_Name LIKE search_term OR s.Email LIKE search_term OR
         s.Phone_Number LIKE search_term OR CONCAT(s.First_Name, ' ', s.Last_Name) LIKE search_term OR
         CONCAT(s.Last_Name, ' ', s.First_Name) LIKE search_term OR s.Roll_No LIKE search_term)
        AND s.Delete_Status = false
        AND (filter_course_id IS NULL OR sc.Course_ID = filter_course_id)
        AND (filter_batch_id IS NULL OR cb.Batch_ID = filter_batch_id)
       AND (
       (enrollment_status = 'enrolled' AND s.Is_Registered = 0) OR
    (enrollment_status = 'not_enrolled' AND s.Is_Registered = 1) OR
    (enrollment_status = 'all')
)
        AND (
            (active_status = 'active' AND s.isActive = 1) OR
            (active_status = 'deactivated' AND s.isActive = 0) OR
            (active_status = 'all')
        )
    GROUP BY s.Student_ID
    ORDER BY s.Roll_No DESC
    LIMIT page_size OFFSET offset_value;
END
`;

db.query('DROP PROCEDURE IF EXISTS Search_student', (err) => {
    if (err) {
        console.error('Error dropping Search_student:', err);
        process.exit(1);
    }
    db.query(sql, (err) => {
        if (err) {
            console.error('Error creating Search_student:', err);
            process.exit(1);
        }
        console.log('Stored procedure Search_student updated successfully.');
        process.exit(0);
    });
});
