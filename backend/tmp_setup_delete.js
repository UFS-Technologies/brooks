const db = require('./config/dbconnection');

const sql = "CREATE PROCEDURE Delete_Attendance(" +
    "IN p_courseId INT," +
    "IN p_batchId INT," +
    "IN p_date VARCHAR(20)" +
") " +
"BEGIN " +
    "DELETE FROM attendance " +
    "WHERE Course_ID = p_courseId " +
    "AND Batch_ID = p_batchId " +
    "AND Attendance_Date = p_date; " +
    "SELECT 1 as success; " +
"END";

db.promise().query('DROP PROCEDURE IF EXISTS Delete_Attendance')
  .then(() => db.promise().query(sql))
  .then(() => {
    console.log('Delete_Attendance SP Created Successfully');
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
