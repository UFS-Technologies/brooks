DELIMITER //

CREATE PROCEDURE `Get_Enquiry_Summary`()
BEGIN
    -- Result Set 1: Enquiry Sources
    SELECT Enquiry_Source_Id, Enquiry_Source_Name 
    FROM enquiry_source 
    WHERE IFNULL(Delete_Status, 0) = 0;

    -- Result Set 2: Follow-up Statuses
    SELECT Status_Id, Status_Name, Status_Color
    FROM followup_status 
    WHERE IFNULL(Delete_Status, 0) = 0 
    ORDER BY Display_Order;

    -- Result Set 3: Counts per Source and Status
    -- We use the latest follow-up for each lead to determine their current status
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
    GROUP BY s.Enquiry_Source_Id, fs.Status_Id;

END //

DELIMITER ;
