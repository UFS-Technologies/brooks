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
};

module.exports = Attendance;
