const { executeTransaction, getmultipleSP } = require("../helpers/sp-caller");

const Attendance = {
  Save_Attendance: async function (attendanceData, markedBy) {
    return executeTransaction("Save_Attendance", [
      JSON.stringify(attendanceData),
      markedBy,
    ]);
  },
  Get_Attendance_History: async function (courseId, batchId, fromDate, toDate, staffId) {
    return executeTransaction("Get_Attendance_History", [
      courseId || 0,
      batchId || 0,
      fromDate || '',
      toDate || '',
      staffId || 0,
    ]);
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
