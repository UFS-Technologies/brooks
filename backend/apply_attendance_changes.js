const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "avies_db",
    multipleStatements: true,
};

async function applyAttendanceChanges() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to DB.");

        // 1. Create attendance table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS attendance (
                Attendance_ID INT AUTO_INCREMENT PRIMARY KEY,
                Student_ID INT NOT NULL,
                Course_ID INT NOT NULL,
                Batch_ID INT NOT NULL,
                Attendance_Date DATE NOT NULL,
                Status TINYINT(1) NOT NULL COMMENT '1: Present, 0: Absent',
                Marked_By INT DEFAULT NULL,
                Created_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_attendance (Student_ID, Batch_ID, Attendance_Date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log("Attendance table created/verified.");

        // 2. Create Save_Attendance procedure
        await connection.query(`DROP PROCEDURE IF EXISTS Save_Attendance;`);
        await connection.query(`
            CREATE PROCEDURE Save_Attendance(
                IN p_attendance_json JSON,
                IN p_marked_by INT
            )
            BEGIN
                DECLARE i INT DEFAULT 0;
                DECLARE n INT;
                
                SET n = JSON_LENGTH(p_attendance_json);
                
                WHILE i < n DO
                    SET @student_id = JSON_EXTRACT(p_attendance_json, CONCAT('$[', i, '].Student_ID'));
                    SET @course_id = JSON_EXTRACT(p_attendance_json, CONCAT('$[', i, '].Course_ID'));
                    SET @batch_id = JSON_EXTRACT(p_attendance_json, CONCAT('$[', i, '].Batch_ID'));
                    SET @attendance_date = JSON_UNQUOTE(JSON_EXTRACT(p_attendance_json, CONCAT('$[', i, '].Attendance_Date')));
                    SET @status = JSON_EXTRACT(p_attendance_json, CONCAT('$[', i, '].Status'));

                    INSERT INTO attendance (Student_ID, Course_ID, Batch_ID, Attendance_Date, Status, Marked_By)
                    VALUES (@student_id, @course_id, @batch_id, @attendance_date, @status, p_marked_by)
                    ON DUPLICATE KEY UPDATE 
                        Status = @status,
                        Marked_By = p_marked_by;
                        
                    SET i = i + 1;
                END WHILE;
            END;
        `);
        console.log("Created Save_Attendance procedure.");

        await connection.end();
        console.log("All Attendance DB changes applied.");
    } catch (e) {
        console.error("Error applying Attendance DB changes:", e);
        if (connection) await connection.end();
    }
}

applyAttendanceChanges();
