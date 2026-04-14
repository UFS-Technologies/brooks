CREATE DEFINER=`root`@`localhost` PROCEDURE `Search_student_lead`(
    IN search_term VARCHAR(100),
    IN page_number INT,
    IN page_size INT,
    IN filter_course_id INT,
    IN filter_batch_id INT,
    IN enrollment_status VARCHAR(50),
    IN followUpStatus VARCHAR(100),
    IN p_user_id INT,
    IN p_user_type_id INT
)
BEGIN
    DECLARE offset_value INT;
    SET search_term = CONCAT('%', search_term, '%');
    SET offset_value = (page_number - 1) * page_size;

    IF enrollment_status IS NULL THEN SET enrollment_status = 'all'; END IF;
    IF followUpStatus IS NULL THEN SET followUpStatus = 'all'; END IF;

    CREATE TEMPORARY TABLE IF NOT EXISTS allowed_staff (staff_id INT);
    TRUNCATE TABLE allowed_staff;

    INSERT INTO allowed_staff (staff_id)
    WITH RECURSIVE staff_hierarchy AS (
        SELECT p_user_id as staff_id
        UNION ALL
        SELECT sta.staff_user_id as staff_id
        FROM staff_team_assignment sta
        INNER JOIN staff_hierarchy sh ON sta.team_lead_user_id = sh.staff_id
    )
    SELECT staff_id FROM staff_hierarchy;

    CREATE TEMPORARY TABLE ranked_fu AS
    SELECT *
    FROM (
        SELECT
            sf.*,
            ROW_NUMBER() OVER (PARTITION BY sf.Student_ID ORDER BY sf.Created_Date DESC) AS rn
        FROM student_followup sf
        JOIN followup_status fs ON fs.Status_Id = sf.Follow_Up_Status_ID
        WHERE sf.Delete_Status = 0 AND fs.Delete_Status = 0
    ) t
    WHERE rn = 1;

    SELECT COUNT(DISTINCT s.Student_ID) AS total_count
    FROM student s
    LEFT JOIN student_course sc ON s.Student_ID = sc.Student_ID
    LEFT JOIN course_batch cb ON sc.Batch_ID = cb.Batch_ID
    LEFT JOIN ranked_fu rf ON rf.Student_ID = s.Student_ID
    LEFT JOIN followup_status fs ON fs.Status_Id = rf.Follow_Up_Status_ID
    WHERE
		s.Is_Registered = 0 AND
        (s.First_Name LIKE search_term OR s.Last_Name LIKE search_term OR s.Email LIKE search_term
        OR s.Phone_Number LIKE search_term OR CONCAT(s.First_Name, ' ', s.Last_Name) LIKE search_term
        OR CONCAT(s.Last_Name, ' ', s.First_Name) LIKE search_term OR s.Roll_No LIKE search_term)
        AND s.Delete_Status = 0
        AND (filter_course_id IS NULL OR sc.Course_ID = filter_course_id)
        AND (filter_batch_id IS NULL OR cb.Batch_ID = filter_batch_id)
        AND (
            enrollment_status IS NULL
            OR enrollment_status = 'all'
            OR (enrollment_status = 'enrolled' AND s.Is_Registered = 0)
            OR (enrollment_status = 'not_enrolled' AND s.Is_Registered = 1)
        )
        AND (
            followUpStatus IS NULL
            OR followUpStatus = 'all'
            OR fs.Status_Name = CONVERT(followUpStatus USING utf8mb4) COLLATE utf8mb4_unicode_ci
        )
        AND (
            s.To_User_Id IN (SELECT staff_id FROM allowed_staff)
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
        rf.Next_Follow_Up_Date,
        rf.Remark,
        fs.Status_Name AS Followup_Status,
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
        cb.Batch_Name,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM student_course sc2
                JOIN course c ON sc2.Course_ID = c.Course_ID
                WHERE sc2.Student_ID = s.Student_ID AND sc2.Delete_Status = 0 AND c.Delete_Status = 0
            ) THEN TRUE ELSE FALSE
        END AS is_enrolled
    FROM student s
    LEFT JOIN student_course sc ON s.Student_ID = sc.Student_ID
    LEFT JOIN course_batch cb ON sc.Batch_ID = cb.Batch_ID
    LEFT JOIN ranked_fu rf ON rf.Student_ID = s.Student_ID
    LEFT JOIN followup_status fs ON fs.Status_Id = rf.Follow_Up_Status_ID
    WHERE
		s.Is_Registered = 0 AND
        (s.First_Name LIKE search_term OR s.Last_Name LIKE search_term OR s.Email LIKE search_term
        OR s.Phone_Number LIKE search_term OR CONCAT(s.First_Name, ' ', s.Last_Name) LIKE search_term
        OR CONCAT(s.Last_Name, ' ', s.First_Name) LIKE search_term OR s.Roll_No LIKE search_term)
        AND s.Delete_Status = 0
        AND (filter_course_id IS NULL OR sc.Course_ID = filter_course_id)
        AND (filter_batch_id IS NULL OR cb.Batch_ID = filter_batch_id)
        AND (
            enrollment_status IS NULL
            OR enrollment_status = 'all'
            OR (enrollment_status = 'enrolled' AND s.Is_Registered = 0)
            OR (enrollment_status = 'not_enrolled' AND s.Is_Registered = 1)
        )
        AND (
            followUpStatus IS NULL
            OR followUpStatus = 'all'
            OR fs.Status_Name = CONVERT(followUpStatus USING utf8mb4) COLLATE utf8mb4_unicode_ci
        )
        AND (
            s.To_User_Id IN (SELECT staff_id FROM allowed_staff)
        )
    GROUP BY s.Student_ID
    ORDER BY s.Roll_No DESC
    LIMIT page_size OFFSET offset_value;

    DROP TEMPORARY TABLE IF EXISTS ranked_fu;
    DROP TEMPORARY TABLE IF EXISTS allowed_staff;
END