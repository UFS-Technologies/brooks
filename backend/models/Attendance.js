const { executeTransaction, getmultipleSP } = require("../helpers/sp-caller");
const db = require("../config/dbconnection");

const Attendance = {
  Save_Attendance: async function (attendanceData, markedBy) {
    return executeTransaction("Save_Attendance", [
      JSON.stringify(attendanceData),
      markedBy,
    ]);
  },
  Get_Attendance_History: async function (courseId, batchId, fromDate, toDate, staffId, page = 1, pageSize = 10) {
    const offset = (page - 1) * pageSize;

    const countSql = `
        SELECT COUNT(*) as total_count FROM (
            SELECT a.Attendance_Date, a.Course_ID, a.Batch_ID
            FROM attendance a 
            WHERE (0 = ? OR a.Course_ID = ?) 
            AND (0 = ? OR a.Batch_ID = ?) 
            AND ('' = ? OR a.Attendance_Date >= ?) 
            AND ('' = ? OR a.Attendance_Date <= ?) 
            GROUP BY a.Attendance_Date, a.Course_ID, a.Batch_ID
        ) as t
    `;
    
    const dataSql = `
        SELECT 
            DATE_FORMAT(a.Attendance_Date, '%Y-%m-%d') as Attendance_Date, 
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
        WHERE (? = 0 OR a.Course_ID = ?) 
        AND (? = 0 OR a.Batch_ID = ?) 
        AND (? = '' OR a.Attendance_Date >= ?) 
        AND (? = '' OR a.Attendance_Date <= ?) 
        GROUP BY a.Attendance_Date, a.Course_ID, a.Batch_ID, a.Marked_By 
        ORDER BY a.Attendance_Date DESC
        LIMIT ? OFFSET ?
    `;

    const [countRes] = await db.promise().query(countSql, [courseId || 0, courseId || 0, batchId || 0, batchId || 0, fromDate || '', fromDate || '', toDate || '', toDate || '']);
    const [dataRes] = await db.promise().query(dataSql, [courseId || 0, courseId || 0, batchId || 0, batchId || 0, fromDate || '', fromDate || '', toDate || '', toDate || '', pageSize, offset]);

    return [countRes, dataRes];
  },
  Get_Attendance_Summary_Report: async function (studentId, courseId, batchId, fromDate, toDate, teacherId, status) {
    return getmultipleSP("Get_Attendance_Summary_Report", [
      studentId || 0,
      courseId || 0,
      batchId || 0,
      fromDate || '',
      toDate || '',
      teacherId || 0,
      status === undefined || status === null ? -1 : status,
    ]);
  },
  Delete_Attendance: async function (courseId, batchId, date) {
    return executeTransaction("Delete_Attendance", [
      courseId || 0,
      batchId || 0,
      date || '',
    ]);
  },
  Get_Attendance_Details_By_Session: async function (courseId, batchId, date) {
    return executeTransaction("Get_Attendance_Details_By_Session", [
      courseId || 0,
      batchId || 0,
      date || '',
    ]);
  },
};

module.exports = Attendance;
