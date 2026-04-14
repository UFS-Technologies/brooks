CREATE DEFINER=`root`@`localhost` PROCEDURE `Login_Check`(
    IN email_ VARCHAR(50),
    IN Password_ VARCHAR(50),
    IN Device_ID_ LONGTEXT
)
BEGIN
    DECLARE User_Id_ INT;
	DECLARE User_Type_Id_ INT;

    -- Update Device_ID for the user
    UPDATE users 
    SET Device_ID = Device_ID_
    WHERE Email = email_ AND Password = Password_ AND Delete_Status = 0;
    
    -- Get User_ID for the authenticated user
    SELECT User_ID,User_Type_Id INTO User_Id_,User_Type_Id_
    FROM users
    WHERE Email = email_ AND Password = Password_ AND Delete_Status = 0;
    
    -- If user exists (User_Id_ is not NULL), proceed with live_class updates
    IF User_Type_Id_ =2
    then
        -- Update live_class table to mark unfinished classes as finished
        UPDATE live_class
        SET End_Time = Start_Time, Is_Finished = 1
        WHERE Is_Finished = 0 AND Teacher_ID = User_Id_;
		
        UPDATE call_history
        SET call_end = call_start, Is_Finished = 1
        WHERE Is_Finished = 0 AND teacher_id = User_Id_ and Is_Student_Called =0;
        
        
        -- Update student_live_class table to set End_Time as Start_Time for the corresponding live classes
			UPDATE student_live_class 
			SET 
				End_Time = (
					SELECT Start_Time  
					FROM live_class 
					WHERE live_class.LiveClass_ID = student_live_class.LiveClass_ID
				)
			WHERE 
				LiveClass_ID IN (
					SELECT LiveClass_ID 
					FROM live_class 
					WHERE Is_Finished = 1
				);
    END IF;
    
    -- Return the user details after login
    SELECT User_ID AS Id, First_Name, Email, PhoneNumber, User_Type_Id
    FROM users
    WHERE Email = email_ AND Password = Password_ AND Delete_Status = 0;

END