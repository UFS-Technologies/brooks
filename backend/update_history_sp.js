const db = require('./config/dbconnection');

const sql = `
CREATE PROCEDURE Get_Attendance_History(
    IN p_courseId INT,
    IN p_batchId INT,
    IN p_fromDate VARCHAR(20),
    IN p_toDate VARCHAR(20),
    IN p_staffId INT
)
BEGIN
    SELECT 
        a.Attendance_Date, 
        a.Course_ID,
        a.Batch_ID,
        c.Course_Name, 
        b.Batch_Name, 
        CONCAT(u.First_Name, ' ', IFNULL(u.Last_Name, '')) as Marked_By_Name, 
        1 as Session, 
        MAX(a.Status) as Status 
    FROM attendance a 
    LEFT JOIN course c ON a.Course_ID = c.Course_ID 
    LEFT JOIN course_batch b ON a.Batch_ID = b.Batch_ID 
    LEFT JOIN users u ON a.Marked_By = u.User_ID 
    WHERE (p_courseId = 0 OR a.Course_ID = p_courseId) 
    AND (p_batchId = 0 OR a.Batch_ID = p_batchId) 
    AND (p_fromDate = '' OR a.Attendance_Date >= p_fromDate) 
    AND (p_toDate = '' OR a.Attendance_Date <= p_toDate) 
    GROUP BY a.Attendance_Date, a.Course_ID, a.Batch_ID, a.Marked_By 
    ORDER BY a.Attendance_Date DESC;
END
`;

db.promise().query('DROP PROCEDURE IF EXISTS Get_Attendance_History')
  .then(() => db.promise().query(sql))
  .then(() => {
    console.log('Get_Attendance_History SP Updated Successfully with IDs');
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
