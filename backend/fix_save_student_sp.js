const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'brooks_db',
    multipleStatements: true
});

const spQuery = `
DROP PROCEDURE IF EXISTS Save_student;
CREATE DEFINER=\`root\`@\`localhost\` PROCEDURE Save_student( 
    IN Student_ID_ INT,
    IN First_Name_ VARCHAR(50),
    IN Last_Name_ VARCHAR(100),
    IN Email_ VARCHAR(100),
    IN Phone_Number_ VARCHAR(50),
    IN Social_Provider_ VARCHAR(50),
    IN Social_ID_ VARCHAR(100),
    IN Delete_Status_ TINYINT,
    IN Profile_Photo_Name_ LONGTEXT,
    IN Profile_Photo_Path_ LONGTEXT,
    IN Avatar_ VARCHAR(40),
    IN Country_Code_ VARCHAR(45),
    IN Country_Code_Name_ VARCHAR(45),
    IN Roll_No_ VARCHAR(50),
    IN Branch_Name_ VARCHAR(255),
    IN Branch_Id_ INT,
    IN Follow_Up_Date_ DATE,
    IN Admission_Date_ VARCHAR(100),
    IN Status_Id_ INT,
    IN Status_Name_ VARCHAR(100),
    IN To_User_Id_ INT,
    IN To_User_Name_ VARCHAR(100),
    IN By_User_Id_ INT,
    IN Remark_ VARCHAR(1000),
    IN Followup_Status_ BOOLEAN,
    IN Department_Id_ INT,
    IN Department_Name_ VARCHAR(100),
    IN Age_ INT,
    IN Qualification_ VARCHAR(100),
    IN Qualification_Description_ VARCHAR(255),
    IN Alt_Phone_Number_ VARCHAR(50),
    IN Address_ VARCHAR(255),
    IN Guardian_Type_ VARCHAR(50),
    IN Guardian_Name_ VARCHAR(100),
    IN Guardian_Phone_ VARCHAR(50),
    IN Guardian_Alt_Phone_ VARCHAR(50),
    IN Height_cm_ INT,
    IN Weight_kg_ INT,
    IN Active_Status_ VARCHAR(50),
    IN Enquiry_Source_Id_ INT,
    IN Created_By_ INT,
    IN Installments_JSON TEXT,
    IN Student_Fees_IDs_JSON TEXT,
    IN isRegistering_ INT,
    IN Registered_By_ INT,
    IN Registered_On_ datetime
)
BEGIN
    DECLARE existing_student_id INT DEFAULT NULL;
    DECLARE existing_user_id INT DEFAULT NULL;
    DECLARE student_action_source VARCHAR(10);
    DECLARE was_existing TINYINT DEFAULT 0;
    DECLARE v_isActive TINYINT DEFAULT 0;
    DECLARE v_Status_Name VARCHAR(100);
    DECLARE v_Admission_Date DATE;

    -- Date parsing logic
    IF Admission_Date_ IS NULL OR Admission_Date_ = '' OR Admission_Date_ = '0000-00-00' THEN
        SET v_Admission_Date = NULL;
    ELSE
        SET v_Admission_Date = STR_TO_DATE(SUBSTRING_INDEX(Admission_Date_, 'T', 1), '%Y-%m-%d');
    END IF;

    -- Map Active_Status_ to isActive and potentially override Status_Name
    SET v_Status_Name = Status_Name_;
    
    IF LOWER(Active_Status_) = 'active' THEN
        SET v_isActive = 1;
    ELSE
        SET v_isActive = 0;
        -- If status is specifically Completed or Dropout, update v_Status_Name
        IF LOWER(Active_Status_) = 'completed' THEN
            SET v_Status_Name = 'completed';
        ELSEIF LOWER(Active_Status_) = 'dropout' THEN
            SET v_Status_Name = 'dropout';
        END IF;
    END IF;

    main_block: BEGIN
        -- Check if email exists in users
        IF Email_ != '' THEN
            SELECT User_ID INTO existing_user_id
            FROM users
            WHERE LOWER(Email) = LOWER(Email_) AND Delete_Status = 0
            LIMIT 1;
        END IF;

        IF existing_user_id IS NOT NULL THEN
            SELECT existing_user_id AS Student_ID, 'User' AS Source, 1 AS existingUser, 1 AS duplicateEmail, 0 AS duplicatePhone;
            LEAVE main_block;
        END IF;

        -- Update or Insert student
        IF Student_ID_ > 0 THEN
            IF Email_ != '' THEN
                SELECT Student_ID INTO existing_student_id
                FROM student
                WHERE LOWER(Email) = LOWER(Email_) AND Delete_Status = 0 AND Student_ID != Student_ID_
                LIMIT 1;
                
                IF existing_student_id IS NOT NULL THEN
                    SELECT existing_student_id AS Student_ID, 'Student' AS Source, 1 AS existingUser, 1 AS duplicateEmail, 0 AS duplicatePhone;
                    LEAVE main_block;
                END IF;
            END IF;

            IF Phone_Number_ != '' THEN
                SELECT Student_ID INTO existing_student_id
                FROM student
                WHERE Phone_Number = Phone_Number_ AND Country_Code = Country_Code_ AND Delete_Status = 0 AND Student_ID != Student_ID_
                LIMIT 1;
                
                IF existing_student_id IS NOT NULL THEN
                    SELECT existing_student_id AS Student_ID, 'Student' AS Source, 1 AS existingUser, 0 AS duplicateEmail, 1 AS duplicatePhone;
                    LEAVE main_block;
                END IF;
            END IF;

            -- If no duplicates, proceed with update
            UPDATE student 
            SET First_Name = First_Name_,
                Last_Name = Last_Name_,
                Email = Email_,
                Phone_Number = Phone_Number_,
                Social_Provider = Social_Provider_,
                Social_ID = Social_ID_,
                Profile_Photo_Name = Profile_Photo_Name_,
                Profile_Photo_Path = Profile_Photo_Path_,
                Delete_Status = Delete_Status_,
                Avatar = Avatar_,
                Country_Code = Country_Code_,
                Country_Code_Name = Country_Code_Name_,
                Roll_No = Roll_No_,
                Branch_Name = Branch_Name_,
                Branch_Id = Branch_Id_,
                Follow_Up_Date = Follow_Up_Date_,
                Admission_Date = v_Admission_Date,
                Status_Id = Status_Id_,
                Status_Name = v_Status_Name,
                To_User_Id = To_User_Id_,
                To_User_Name = To_User_Name_,
                By_User_Id = By_User_Id_,
                Remark = Remark_,
                Followup_Status = Followup_Status_,
                Department_Id = Department_Id_,
                Department_Name = Department_Name_,
                Age = Age_,
                Qualification = Qualification_,
                Qualification_Description = Qualification_Description_,
                Alt_Phone_Number = Alt_Phone_Number_,
                Address = Address_,
                Guardian_Type = Guardian_Type_,
                Guardian_Name = Guardian_Name_,
                Guardian_Phone = Guardian_Phone_,
                Guardian_Alt_Phone = Guardian_Alt_Phone_,
                Height_cm = Height_cm_,
                Weight_kg = Weight_kg_,
                isActive = v_isActive,
                Enquiry_Source_Id = Enquiry_Source_Id_,
                Is_Registered = isRegistering_,
                Registered_By = Registered_By_,
                Registration_No = Roll_No_,
                Registered_On = Registered_On_
            WHERE Student_ID = Student_ID_;

            SET existing_student_id = Student_ID_;
            SET student_action_source = 'Student';
            SET was_existing = 0;
        ELSE
            IF Email_ != '' THEN
                SELECT Student_ID INTO existing_student_id
                FROM student
                WHERE LOWER(Email) = LOWER(Email_) AND Delete_Status = 0
                LIMIT 1;
                
                IF existing_student_id IS NOT NULL THEN
                    SELECT existing_student_id AS Student_ID, 'Student' AS Source, 1 AS existingUser, 1 AS duplicateEmail, 0 AS duplicatePhone;
                    LEAVE main_block;
                END IF;
            END IF;

            IF Phone_Number_ != '' THEN
                SELECT Student_ID INTO existing_student_id
                FROM student
                WHERE Phone_Number = Phone_Number_ AND Country_Code = Country_Code_ AND Delete_Status = 0
                LIMIT 1;
                
                IF existing_student_id IS NOT NULL THEN
                    SELECT existing_student_id AS Student_ID, 'Student' AS Source, 1 AS existingUser, 0 AS duplicateEmail, 1 AS duplicatePhone;
                    LEAVE main_block;
                END IF;
            END IF;

            -- If no duplicates, proceed with insert
            INSERT INTO student (
                First_Name, Last_Name, Email, Phone_Number, Social_Provider, Social_ID,
                Delete_Status, Profile_Photo_Name, Profile_Photo_Path, Avatar,
                Country_Code, Country_Code_Name, Roll_No, Branch_Name, Branch_Id,
                Follow_Up_Date, Admission_Date, Status_Id, Status_Name, To_User_Id, To_User_Name,
                By_User_Id, Remark, Followup_Status, Department_Id, Department_Name, Age, Qualification, Qualification_Description, Alt_Phone_Number,
                Address, Guardian_Type, Guardian_Name, Guardian_Phone, Guardian_Alt_Phone,
                Height_cm, Weight_kg, isActive, Enquiry_Source_Id, Is_Registered, Registered_By, Registration_No, Registered_On
            )
            VALUES (
                First_Name_, Last_Name_, Email_, Phone_Number_, Social_Provider_, Social_ID_,
                Delete_Status_, Profile_Photo_Name_, Profile_Photo_Path_, Avatar_,
                Country_Code_, Country_Code_Name_, Roll_No_, Branch_Name_, Branch_Id_,
                Follow_Up_Date_, v_Admission_Date, Status_Id_, v_Status_Name, To_User_Id_, To_User_Name_,
                By_User_Id_, Remark_, Followup_Status_, Department_Id_, Department_Name_, Age_, Qualification_, Qualification_Description_, Alt_Phone_Number_,
                Address_, Guardian_Type_, Guardian_Name_, Guardian_Phone_, Guardian_Alt_Phone_,
                Height_cm_, Weight_kg_, v_isActive, Enquiry_Source_Id_, isRegistering_, Registered_By_, Roll_No_, Registered_On_
            );

            SET existing_student_id = LAST_INSERT_ID();
            SET student_action_source = 'Student';
            SET was_existing = 0;
        END IF;

        -- Insert installments if provided
        IF Installments_JSON IS NOT NULL AND JSON_LENGTH(Installments_JSON) > 0 THEN
            INSERT INTO installments (
                student_id, Installment_information_ID,
                amount, tax_applied, tax_amount,
                payment_mode, cheque_date, payment_status,
                details, created_by, Delete_Status,
                installment_date, batch_id, batch_name,
                course_id, course_name
            )
            SELECT
                existing_student_id,
                JSON_UNQUOTE(JSON_EXTRACT(j.inst, '$.Installment_information_ID')),
                CAST(JSON_UNQUOTE(JSON_EXTRACT(j.inst, '$.Amount')) AS DECIMAL(10,2)),
                0.00, 0.00,
                NULL, NULL, 'NOT PAID',
                JSON_UNQUOTE(JSON_EXTRACT(j.inst, '$.Details')),
                Created_By_, 0,
                STR_TO_DATE(SUBSTRING_INDEX(JSON_UNQUOTE(JSON_EXTRACT(j.inst, '$.DueDate')), 'T', 1), '%Y-%m-%d'),
                NULL, NULL,
                CAST(JSON_EXTRACT(j.inst, '$.Course_ID') AS UNSIGNED),
                JSON_UNQUOTE(JSON_EXTRACT(j.inst, '$.Course_Name'))
            FROM JSON_TABLE(Installments_JSON, '$[*]' COLUMNS (
                inst JSON PATH '$'
            )) AS j;

            INSERT INTO student_fees_details (
                Student_ID,
                Installment_information_ID,
                Course_ID,
                Course_Name,
                Total_Amount,
                Paid_Amount,
                Fee_Status,
                Due_Date,
                Delete_Status,
                Installment_Index
            )
            SELECT
                existing_student_id,
                JSON_UNQUOTE(JSON_EXTRACT(j.inst, '$.Installment_information_ID')),
                CAST(JSON_EXTRACT(j.inst, '$.Course_ID') AS UNSIGNED),
                JSON_UNQUOTE(JSON_EXTRACT(j.inst, '$.Course_Name')),
                CAST(JSON_UNQUOTE(JSON_EXTRACT(j.inst, '$.Amount')) AS DECIMAL(10,2)),
                0.00,
                'Pending',
                CAST(JSON_UNQUOTE(JSON_EXTRACT(j.inst, '$.DueDate')) AS DATE),
                0,
                1
            FROM JSON_TABLE(Installments_JSON, '$[*]' COLUMNS (
                inst JSON PATH '$'
            )) AS j;
        END IF;

        -- Soft delete student_fees_details if IDs are provided
        IF Student_Fees_IDs_JSON IS NOT NULL AND JSON_LENGTH(Student_Fees_IDs_JSON) > 0 THEN
            UPDATE student_fees_details
            SET Delete_Status = 1
            WHERE Student_Fees_ID IN (
                SELECT CAST(j.id AS UNSIGNED)
                FROM JSON_TABLE(Student_Fees_IDs_JSON, '$[*]' COLUMNS (
                    id INT PATH '$'
                )) AS j
            );
        END IF;
        
        -- Update fee balance
        CALL Update_Fee_Balance(existing_student_id);

        -- Final result
        SELECT existing_student_id AS Student_ID, student_action_source AS Source, was_existing AS existingUser;

    END main_block;
END
`;

connection.query(spQuery, (err, results) => {
    if (err) {
        console.error('Error applying SP:', err);
    } else {
        console.log('Successfully applied fixed Save_student stored procedure.');
    }
    connection.end();
});
