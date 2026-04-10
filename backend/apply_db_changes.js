const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
    multipleStatements: true,
};

async function applyDbChanges() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to DB.");

        // 1. Alter users table
        try {
            await connection.query("ALTER TABLE users ADD COLUMN Basic_Pay DECIMAL(10,2) DEFAULT NULL");
            console.log("Added Basic_Pay column to users table.");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("Basic_Pay column already exists.");
            } else {
                throw e;
            }
        }

        // 2. Create Leaves table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS Leaves (
                Leave_Id INT AUTO_INCREMENT PRIMARY KEY,
                User_Id INT NOT NULL,
                From_Date DATE,
                To_Date DATE,
                Reason TEXT,
                Status VARCHAR(50) DEFAULT 'Pending',
                Is_Deleted TINYINT DEFAULT 0,
                Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (User_Id) REFERENCES users(User_ID)
            );
        `);
        console.log("Leaves table created/verified.");

        // 3. Update Save_User procedure
        await connection.query(`DROP PROCEDURE IF EXISTS Save_User;`);
        const saveUserSp = `CREATE DEFINER=\`root\`@\`localhost\` PROCEDURE \`Save_User\`(
 IN User_ID_ INT,
    IN First_Name_ VARCHAR(50),
    IN Last_Name_ VARCHAR(100),
    IN Email_ VARCHAR(100),
    IN PhoneNumber_ VARCHAR(50),
    IN Delete_Status_ TINYINT,
    IN User_Type_Id_ INT,
    IN User_Role_Id_ INT,
    IN Branch_Id_ INT,
    IN User_Status_ VARCHAR(50),
    IN password_ VARCHAR(50),
    IN Device_ID_ LONGTEXT,
    IN Profile_Photo_Name_ LONGTEXT,
    IN Profile_Photo_Path_ LONGTEXT,
    IN Course_IDs_ JSON,  -- JSON array of course IDs
    IN Hod_ BOOLEAN,
	IN teacherCourses JSON,
    IN Basic_Pay_ DECIMAL(10,2)
)
BEGIN
    DECLARE emailExists INT;
    DECLARE phoneExists INT;
    DECLARE emailExistsInStudent INT;
    DECLARE courseIndex INT DEFAULT 0;
    DECLARE HodtotalCourses INT;

#for time slots
	DECLARE temp_start_time VARCHAR(20);
	DECLARE temp_end_time VARCHAR(20);
    
    DECLARE v_TimeSlotcourseIndex INT DEFAULT 0;
    DECLARE v_totalCourses INT;
    DECLARE v_totalSlots INT;
    DECLARE v_slotIndex INT;
    DECLARE v_course JSON;
    DECLARE v_courseTeacher_ID INT;
    DECLARE v_Course_ID INT;
    DECLARE v_Delete_Status TINYINT;
    DECLARE v_slot JSON;
    DECLARE v_Slot_Id INT;
    DECLARE v_start_time VARCHAR(50);
    DECLARE v_end_time VARCHAR(50);
    DECLARE v_Batch_ID INT;
    
    -- Check for existing email in users table (case-insensitive)
    SELECT COUNT(*)
    INTO emailExists
    FROM users
    WHERE LOWER(Email) = LOWER(Email_) AND User_ID <> User_ID_ AND Delete_Status = 0;

    -- Check for existing phone number in users table
    SELECT COUNT(*)
    INTO phoneExists
    FROM users
    WHERE PhoneNumber = PhoneNumber_ AND User_ID <> User_ID_ AND Delete_Status = 0;

    -- Check if email exists in the student table (case-insensitive)
    SELECT COUNT(*)
    INTO emailExistsInStudent
    FROM student
    WHERE LOWER(Email) = LOWER(Email_) AND Delete_Status = 0;

    -- If email or phone number exists in users table, or email exists in student table, signal an error
    IF emailExists > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email already exists in users';
    ELSEIF phoneExists > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Phone number already exists in users';
    ELSEIF emailExistsInStudent > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email already exists in students';
    ELSE
        -- Update existing user
        IF User_ID_ > 0 THEN
            insert into data_log values (442,User_Type_Id_);

            UPDATE users
            SET First_Name = First_Name_,
                Last_Name = Last_Name_,
                Email = Email_,
                PhoneNumber = PhoneNumber_,
                Delete_Status = Delete_Status_,
                User_Type_Id = User_Type_Id_,
                User_Role_Id = User_Role_Id_,
                Branch_Id = Branch_Id_,
                Device_ID = Device_ID_,
                Profile_Photo_Name = Profile_Photo_Name_,
                Profile_Photo_Path = Profile_Photo_Path_,
                password = password_,
                Basic_Pay = Basic_Pay_
            WHERE User_ID = User_ID_;
        ELSE
            -- Insert new user
            INSERT INTO users (First_Name, Last_Name, Email, PhoneNumber, Delete_Status, User_Type_Id, User_Role_Id,Branch_Id, password, Profile_Photo_Name, Profile_Photo_Path, Device_ID, Basic_Pay)
            VALUES (First_Name_, Last_Name_, Email_, PhoneNumber_, Delete_Status_, User_Type_Id_, User_Role_Id_,Branch_Id_, password_, Profile_Photo_Name_, Profile_Photo_Path_, Device_ID_, Basic_Pay_);
            SET User_ID_ = LAST_INSERT_ID();
        END IF;

        -- Additional logic for course and user type handling
        IF User_Type_Id_ = 2 THEN
            DELETE FROM course_hod WHERE User_ID = User_ID_;
            
            SET v_totalCourses = JSON_LENGTH(teacherCourses);
            insert into data_log values (2,v_TimeSlotcourseIndex);
            insert into data_log values (3,v_totalCourses);
            WHILE v_TimeSlotcourseIndex < v_totalCourses DO
                insert into data_log values (256,v_TimeSlotcourseIndex);

                -- Extract each teacherCourse
                SET v_course = JSON_EXTRACT(teacherCourses, CONCAT('$[', v_TimeSlotcourseIndex, ']'));
                insert into data_log values (73,v_course);

                SET v_CourseTeacher_ID = JSON_UNQUOTE(JSON_EXTRACT(v_course, '$.CourseTeacher_ID'));
                insert into data_log values (64,v_CourseTeacher_ID);

                SET v_Course_ID = JSON_UNQUOTE(JSON_EXTRACT(v_course, '$.Course_ID'));
                insert into data_log values (65,v_Course_ID);

                SET v_Delete_Status = JSON_UNQUOTE(JSON_EXTRACT(v_course, '$.Delete_Status'));

                IF v_CourseTeacher_ID IS NULL or v_CourseTeacher_ID <= 0 THEN
                    -- Insert new course_teacher
                    INSERT INTO course_teacher (Course_ID, Teacher_ID, Delete_Status)
                    VALUES (v_Course_ID, User_ID_, v_Delete_Status);
                    SET v_CourseTeacher_ID = LAST_INSERT_ID();
                ELSE
                    -- Update existing course_teacher
                    UPDATE course_teacher
                    SET Course_ID = v_Course_ID,
                        Teacher_ID = User_ID_,
                        Delete_Status = v_Delete_Status
                    WHERE CourseTeacher_ID = v_CourseTeacher_ID;
                END IF;

                -- Process timeSlots within this teacherCourse
                SET v_totalSlots = JSON_LENGTH(JSON_EXTRACT(v_course, '$.timeSlots'));
                SET v_slotIndex = 0;

                WHILE v_slotIndex < v_totalSlots DO
                    SET v_slot = JSON_EXTRACT(v_course, CONCAT('$.timeSlots[', v_slotIndex, ']'));
                    SET v_Slot_Id = JSON_UNQUOTE(JSON_EXTRACT(v_slot, '$.Slot_Id'));
                    SET temp_start_time = JSON_UNQUOTE(JSON_EXTRACT(v_slot, '$.start_time'));
                    SET temp_end_time = JSON_UNQUOTE(JSON_EXTRACT(v_slot, '$.end_time'));
                    SET v_Batch_ID = JSON_UNQUOTE(JSON_EXTRACT(v_slot, '$.Batch_ID'));
                    SET v_Delete_Status = JSON_UNQUOTE(JSON_EXTRACT(v_slot, '$.Delete_Status'));
                    
                    SET v_start_time = CASE 
                        WHEN temp_start_time REGEXP '^[0-9]{1,2}:[0-9]{2} [AP]M$' 
                        THEN TIME_FORMAT(STR_TO_DATE(temp_start_time, '%l:%i %p'), '%H:%i')
                        ELSE TIME_FORMAT(TIME(temp_start_time), '%H:%i')
                    END;

                    SET v_end_time = CASE 
                        WHEN temp_end_time REGEXP '^[0-9]{1,2}:[0-9]{2} [AP]M$' 
                        THEN TIME_FORMAT(STR_TO_DATE(temp_end_time, '%l:%i %p'), '%H:%i')
                        ELSE TIME_FORMAT(TIME(temp_end_time), '%H:%i')
                    END;

                    IF v_Slot_Id IS NULL OR v_Slot_Id <= 0 THEN
                        -- Insert new teacher_time_slot
                        IF v_Batch_ID > 0 THEN
                            INSERT INTO teacher_time_slot (CourseTeacher_ID, start_time, end_time, batch_id, Delete_Status)
                            VALUES (v_CourseTeacher_ID, v_start_time, v_end_time, v_Batch_ID, v_Delete_Status);
                        ELSE
                            INSERT INTO teacher_time_slot (CourseTeacher_ID, start_time, end_time, Delete_Status)
                            VALUES (v_CourseTeacher_ID, v_start_time, v_end_time, v_Delete_Status);
                        END IF;
                    ELSE
                        -- Update existing teacher_time_slot (skip batch_id update if NULL)
                        IF v_Batch_ID > 0 THEN
                            UPDATE teacher_time_slot
                            SET start_time = v_start_time,
                                end_time = v_end_time,
                                batch_id = v_Batch_ID,
                                Delete_Status = v_Delete_Status
                            WHERE Slot_Id = v_Slot_Id;
                        ELSE
                            UPDATE teacher_time_slot
                            SET start_time = v_start_time,
                                end_time = v_end_time,
                                batch_id = Null,
                                Delete_Status = v_Delete_Status
                            WHERE Slot_Id = v_Slot_Id;
                        END IF;
                    END IF;

                    SET v_slotIndex = v_slotIndex + 1;
                END WHILE;

                SET v_TimeSlotcourseIndex = v_TimeSlotcourseIndex + 1;
            END WHILE;

        ELSEIF User_Type_Id_ = 3 THEN
            IF EXISTS (SELECT 1 FROM course_teacher WHERE Teacher_ID = User_ID_ AND Delete_Status = 0) THEN
                UPDATE users SET User_Type_Id = 2 WHERE User_ID = User_ID_;
                SET User_ID_ = -1;
            ELSE
                DELETE FROM course_hod WHERE User_ID = User_ID_;
                
                -- Get total number of items in the Course_IDs_ JSON array
                SET HodtotalCourses = JSON_LENGTH(Course_IDs_);
 
                -- Loop through each Course_ID in the JSON array and insert into course_hod
                WHILE courseIndex < HodtotalCourses DO
                    INSERT INTO course_hod (Course_ID, User_ID, Delete_Status)
                    VALUES (CAST(JSON_EXTRACT(Course_IDs_, CONCAT('$[', courseIndex, ']')) AS UNSIGNED), User_ID_, 0);
                    SET courseIndex = courseIndex + 1;
                END WHILE;
            END IF;
        END IF;
    END IF;
    insert into data_log values (2546,v_TimeSlotcourseIndex);

    -- Return User_ID
    SELECT User_ID_ AS User_ID;
END`;
        await connection.query(saveUserSp);
        console.log("Updated Save_User procedure.");

        // 4. Create Leave procedures
        await connection.query(`DROP PROCEDURE IF EXISTS Save_Leave;`);
        await connection.query(`
            CREATE PROCEDURE Save_Leave(
                IN Leave_Id_ INT,
                IN User_Id_ INT,
                IN From_Date_ DATE,
                IN To_Date_ DATE,
                IN Reason_ TEXT,
                IN Status_ VARCHAR(50)
            )
            BEGIN
                IF Leave_Id_ > 0 THEN
                    UPDATE Leaves
                    SET From_Date = From_Date_, To_Date = To_Date_, Reason = Reason_, Status = Status_
                    WHERE Leave_Id = Leave_Id_;
                    SELECT Leave_Id_ AS Leave_Id;
                ELSE
                    INSERT INTO Leaves (User_Id, From_Date, To_Date, Reason, Status)
                    VALUES (User_Id_, From_Date_, To_Date_, Reason_, Status_);
                    SELECT LAST_INSERT_ID() AS Leave_Id;
                END IF;
            END;
        `);
        console.log("Created Save_Leave.");

        await connection.query(`DROP PROCEDURE IF EXISTS Get_Leaves;`);
        await connection.query(`
            CREATE PROCEDURE Get_Leaves(IN User_Id_ INT)
            BEGIN
                IF User_Id_ > 0 THEN
                    SELECT l.*, u.First_Name, u.Last_Name 
                    FROM Leaves l
                    JOIN users u ON l.User_Id = u.User_ID
                    WHERE l.User_Id = User_Id_ AND l.Is_Deleted = 0
                    ORDER BY l.Created_At DESC;
                ELSE
                    SELECT l.*, u.First_Name, u.Last_Name 
                    FROM Leaves l
                    JOIN users u ON l.User_Id = u.User_ID
                    WHERE l.Is_Deleted = 0
                    ORDER BY l.Created_At DESC;
                END IF;
            END;
        `);
        console.log("Created Get_Leaves.");

        await connection.query(`DROP PROCEDURE IF EXISTS Delete_Leave;`);
        await connection.query(`
            CREATE PROCEDURE Delete_Leave(IN Leave_Id_ INT)
            BEGIN
                UPDATE Leaves SET Is_Deleted = 1 WHERE Leave_Id = Leave_Id_;
                SELECT Leave_Id_ AS Leave_Id;
            END;
        `);
        console.log("Created Delete_Leave.");
        
        await connection.end();
        console.log("All DB changes applied.");
    } catch (e) {
        console.error("Error applying DB changes:", e);
        if (connection) await connection.end();
    }
}

applyDbChanges();
