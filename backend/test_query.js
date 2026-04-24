const db = require('./config/dbconnection');
const staffId = 110;

const sql = `
    SELECT COUNT(DISTINCT s.Student_ID) AS totalRecords
    FROM student s
    INNER JOIN student_course sc ON s.Student_ID = sc.Student_ID
    LEFT JOIN course_batch cb ON sc.Batch_ID = cb.Batch_ID
    WHERE s.Delete_Status = 0
      AND (
          sc.Batch_ID IN (
              SELECT tts.batch_id 
              FROM teacher_time_slot tts 
              JOIN course_teacher ct ON tts.CourseTeacher_ID = ct.CourseTeacher_ID 
              WHERE ct.Teacher_ID = ? AND IFNULL(tts.Delete_Status, 0) = 0 AND IFNULL(ct.Delete_Status, 0) = 0
              AND tts.batch_id IS NOT NULL
          )
          OR sc.Course_ID IN (
              SELECT ct.Course_ID 
              FROM course_teacher ct 
              WHERE ct.Teacher_ID = ? AND IFNULL(ct.Delete_Status, 0) = 0
              AND NOT EXISTS (
                  SELECT 1 FROM teacher_time_slot tts 
                  WHERE tts.CourseTeacher_ID = ct.CourseTeacher_ID 
                  AND IFNULL(tts.Delete_Status, 0) = 0 
                  AND tts.batch_id IS NOT NULL
              )
          )
          OR sc.Slot_Id IN (
              SELECT tts.Slot_Id 
              FROM teacher_time_slot tts 
              JOIN course_teacher ct ON tts.CourseTeacher_ID = ct.CourseTeacher_ID 
              WHERE ct.Teacher_ID = ? AND IFNULL(tts.Delete_Status, 0) = 0 AND IFNULL(ct.Delete_Status, 0) = 0
          )
      )
      AND (s.First_Name LIKE ? OR s.Last_Name LIKE ? OR s.Email LIKE ? OR s.Phone_Number LIKE ?)
      AND (? IS NULL OR cb.Batch_Name LIKE ?)
      AND (? IS NULL OR s.Entry_Date >= ?)
      AND (? IS NULL OR s.Entry_Date <= ?)
`;

const params = [
    staffId, staffId, staffId,
    '%', '%', '%', '%',
    null, '%',
    null, null,
    null, null
];

db.promise().query(sql, params)
    .then(([rows]) => {
        console.log(rows);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
