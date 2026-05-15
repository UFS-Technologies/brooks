DROP PROCEDURE IF EXISTS Save_student_followup;
DELIMITER //
CREATE PROCEDURE `Save_student_followup`(
    IN Follow_Up_ID_ INT,
    IN Student_ID_ INT,
    IN Branch_ID_ INT,
    IN Branch_Name_ VARCHAR(255),
    IN Department_ID_ INT,
    IN Department_Name_ VARCHAR(255),
    IN Assigned_Staff_ID_ INT,
    IN Assigned_Staff_Name_ VARCHAR(255),
    IN Follow_Up_Status_ID_ INT,
    IN Follow_Up_Status_Name_ VARCHAR(100),
    IN Next_Follow_Up_Date_ DATE,
    IN Remark_ TEXT,
    IN Created_Date_ DATE,
    IN Created_By_ INT,
    IN Delete_Status_ TINYINT
)
BEGIN 
	DECLARE _Follow_up_Status int ;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- If updating existing follow-up record
    IF Follow_Up_ID_ > 0 THEN 
        UPDATE student_followup 
        SET Branch_ID = Branch_ID_,
            Branch_Name = Branch_Name_,
            Department_ID = Department_ID_,
            Department_Name = Department_Name_,
            Assigned_Staff_ID = Assigned_Staff_ID_,
            Assigned_Staff_Name = Assigned_Staff_Name_,
            Follow_Up_Status_ID = Follow_Up_Status_ID_,
            Follow_Up_Status_Name = Follow_Up_Status_Name_,
            Next_Follow_Up_Date = Next_Follow_Up_Date_,
            Remark = Remark_,
            Updated_Date = NOW(),
            Updated_By = Created_By_,
            Delete_Status = Delete_Status_
        WHERE Follow_Up_ID = Follow_Up_ID_;
    ELSE
        -- Insert new follow-up record
        INSERT INTO student_followup (
            Student_ID, 
            Branch_ID, 
            Branch_Name, 
            Department_ID, 
            Department_Name, 
            Assigned_Staff_ID, 
            Assigned_Staff_Name, 
            Follow_Up_Status_ID, 
            Follow_Up_Status_Name, 
            Next_Follow_Up_Date, 
            Remark, 
            Created_Date, 
            Created_By, 
            Delete_Status
        )
        VALUES (
            Student_ID_, 
            Branch_ID_, 
            Branch_Name_, 
            Department_ID_, 
            Department_Name_, 
            Assigned_Staff_ID_, 
            Assigned_Staff_Name_, 
            Follow_Up_Status_ID_, 
            Follow_Up_Status_Name_, 
            Next_Follow_Up_Date_, 
            Remark_, 
            Created_Date_, 
            Created_By_, 
            Delete_Status_
        );
        
        SET Follow_Up_ID_ = LAST_INSERT_ID();
    END IF;

    -- Update student table state
    SET _Follow_up_Status = (SELECT Is_Active FROM followup_status WHERE Status_Id = Follow_Up_Status_ID_ LIMIT 1);
    
    UPDATE student 
    SET Followup_Status = COALESCE(_Follow_up_Status, 1),
        Branch_Id = Branch_ID_,
        Branch_Name = Branch_Name_,
        Department_Id = Department_ID_,
        Department_Name = Department_Name_,
        Status_Name = Follow_Up_Status_Name_,
        Remark = Remark_,
        To_User_Id = Assigned_Staff_ID_,
        To_User_Name = Assigned_Staff_Name_,
        Follow_Up_Date = Next_Follow_Up_Date_
    WHERE Student_ID = Student_ID_;
    
    COMMIT;
    
    SELECT Follow_Up_ID_ AS Follow_Up_ID, 'Success' AS Status;
END //
DELIMITER ;
