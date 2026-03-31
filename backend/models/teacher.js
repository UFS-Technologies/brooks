var fs = require('fs');
const { executeTransaction } = require('../helpers/sp-caller');
var teacher =
{

    Get_Teacher_courses: async function (teacher_Id_) {
        console.log('teacher_Id_: ', teacher_Id_); 
        return executeTransaction('Get_Teacher_courses', [teacher_Id_]);
    },
    Get_Teacher_courses_With_Batch : async function (teacher_Id_) {
        return executeTransaction('Get_Teacher_courses_With_Batch ', [teacher_Id_]);
    },
    Get_Teacher_Students : async function (teacher_Id_,courseId) {
        return executeTransaction('Get_Teacher_Students ', [teacher_Id_,courseId]);
    },
    Get_teacherBatch_of_oneOnOne : async function (teacher_Id_) {
        return executeTransaction('Get_teacherBatch_of_oneOnOne ', [teacher_Id_]);
    },
    
    Get_OnGoing_liveClass: async function (teacher_Id_) {
        return executeTransaction('Get_OnGoing_liveClass', [teacher_Id_]);
    },
    Get_Upcomming_liveClass: async function (teacher_Id_) {
        return executeTransaction('Get_Upcomming_liveClass', [teacher_Id_]);
    },
    Get_Completed_liveClass: async function (teacher_Id_) {
        return executeTransaction('Get_Completed_liveClass', [teacher_Id_]);
    },
    Get_liveClass: async function (teacher_Id_) {
        return executeTransaction('Get_liveClass', [teacher_Id_]);
    },
    Get_Student_TimeSlots_By_TeacherID: async function (teacher_Id_) {
        return executeTransaction('Get_Student_TimeSlots_By_TeacherID', [teacher_Id_]);
    },
    Get_Teacher_Timing: async function (teacher_Id_) {
        return executeTransaction('Get_Teacher_Timing', [teacher_Id_]);
    },
    Get_Batch_StudentList: async function (Batch_Id) {
        return executeTransaction('Get_Batch_StudentList', [Batch_Id]);
    },
    Save_LiveClass: async function (Liveclass) {
        return executeTransaction('Save_LiveClass', [
            Liveclass.LiveClass_ID,
            Liveclass.Course_ID,
            Liveclass.Teacher_ID,
            Liveclass.Batch_Id,
            Liveclass.Scheduled_DateTime,
            Liveclass.Duration,
            Liveclass.Start_Time,
            Liveclass.End_Time,
            Liveclass.Live_Link,
            Liveclass.Record_Class_Link,
            Liveclass.Slot_Id,

        ]);
    },
    Update_Record_ClassLink: async function (Liveclass) {
        return executeTransaction('Update_Record_ClassLink', [
            Liveclass.LiveClass_ID,
            Liveclass.Record_Class_Link,
        ]);
    },
    
    Update_Record_Class_By_Link: async function (Liveclass) {
        return executeTransaction('Update_Record_Class_By_Link', [
            Liveclass.LiveClass_Link,
            Liveclass.Record_Class_Link,
        ]);
    },
    Save_OneToOne_Record_By_Link: async function (recording) {
        return executeTransaction('Save_OneToOne_Record_By_Link', [
            recording.Live_Link,
            recording.Record_Class_Link,
        ]);
    },
  
};
module.exports = teacher;