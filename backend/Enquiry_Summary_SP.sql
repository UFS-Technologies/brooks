DELIMITER //

CREATE PROCEDURE Get_Enquiry_Summary()
BEGIN
    -- Result Set 1: Enquiry Sources
    SELECT Enquiry_Source_Id, Enquiry_Source_Name 
    FROM enquiry_source 
    WHERE Delete_Status = 0
    ORDER BY Enquiry_Source_Name;

    -- Result Set 2: Follow-up Statuses
    SELECT Status_Id, Status_Name, Status_Color
    FROM followup_status 
    WHERE Delete_Status = 0 AND Is_Active = 1
    ORDER BY Display_Order, Status_Name;

    -- Result Set 3: Counts per Source and Status
    SELECT 
        Enquiry_Source_Id, 
        Status_Id, 
        COUNT(*) AS LeadCount
    FROM student
    WHERE Delete_Status = 0
    GROUP BY Enquiry_Source_Id, Status_Id;

END //

DELIMITER ;
