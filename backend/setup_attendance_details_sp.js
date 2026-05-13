const db = require('./config/dbconnection');

const sql = "CREATE PROCEDURE Get_Attendance_Details_By_Session(" +
    "IN p_courseId INT," +
    "IN p_batchId INT," +
    "IN p_date VARCHAR(20)" +
") " +
"BEGIN " +
    "SELECT " +
        "s.Student_ID, " +
        "CONCAT(s.First_Name, ' ', IFNULL(s.Last_Name, '')) as Student_Name, " +
        "a.Status " +
    "FROM attendance a " +
    "JOIN student s ON a.Student_ID = s.Student_ID " +
    "WHERE a.Course_ID = p_courseId " +
    "AND a.Batch_ID = p_batchId " +
    "AND a.Attendance_Date = p_date; " +
"END";

db.promise().query('DROP PROCEDURE IF EXISTS Get_Attendance_Details_By_Session')
  .then(() => db.promise().query(sql))
  .then(() => {
    console.log('Get_Attendance_Details_By_Session SP Created Successfully');
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
