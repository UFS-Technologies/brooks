var fs = require('fs');
const { executeTransaction, getmultipleSP } = require('../helpers/sp-caller');
const db = require('../config/dbconnection');
var user = {
    Save_user: async function (user) {
        return executeTransaction('Save_User', [
            user.User_ID,
            user.First_Name,
            user.Last_Name,
            user.Email,
            user.PhoneNumber,
            user.Delete_Status,
            user.User_Type_Id,
            user.User_Role_Id,
            user.Branch_Id,
            user.User_Status,
            user.password,
            user.Device_ID,
            user.Profile_Photo_Name,
            user.Profile_Photo_Path,
            JSON.stringify(user.Course_ID),
            user.Hod,
            JSON.stringify(user.teacherCourses),
            user.Basic_Pay || null
        ]);
    },

    Save_Leave: async function (leave) {
        return executeTransaction('Save_Leave', [
            leave.Leave_Id || 0,
            leave.User_Id,
            leave.From_Date,
            leave.To_Date,
            leave.Reason,
            leave.Status || 'Pending'
        ]);
    },

    Get_Leaves: async function (user_Id) {
        return executeTransaction('Get_Leaves', [user_Id || 0]);
    },

    Delete_Leave: async function (leave_Id) {
        return executeTransaction('Delete_Leave', [leave_Id]);
    },

    Save_StudentLiveClass: async function (student) {
        return executeTransaction('Save_StudentLiveClass', [student.StudentLiveClass_ID, student.Student_ID, student.LiveClass_ID, student.Start_Time, student.End_Time, student.Attendance_Duration]);
    },
    Update_Call_Status: async function (callId, type, status, user_Id = 0, isStudent = 0) {
        try {
            const result = await executeTransaction('Update_Call_Status', [callId, type, status, user_Id, isStudent]);
            return result;
        } catch (error) {
            console.error('Error executing Update_Call_Status:', error);
            throw new Error('Error updating call status');
        }
    },

    Save_Call_History: async function (call) {
        return executeTransaction('Save_Call_History', [call.id, call.teacher_id, call.student_id, call.call_start, call.call_end, call.call_duration, call.call_type, call.Is_Student_Called, call.Live_Link, call.is_call_rejected]);
    },
    Delete_user: async function (user_Id_) {
        return executeTransaction('Delete_User', [user_Id_]);
    },
    // Get_All_Menu_Permissions
    Get_All_Menu_Permissions: async function (user_Id_) {
        return getmultipleSP('Get_All_Menu_Permissions', [user_Id_]);
    },
    Get_user_Menus: async function (user_Id_) {
        return getmultipleSP('Get_user_Menus', [user_Id_]);
    },

    Get_user: async function (user_Id_) {
        return executeTransaction('Get_user', [user_Id_]);
    },
    Search_user: async function (params) {
        const {
            user_Name,
            slot_wise,
            batch_wise,
            course_id,
            hod_only
        } = params;

        // Handle undefined search term
        const searchTerm = user_Name === undefined || user_Name === 'undefined' ? '' : user_Name;

        // Pass all parameters to the stored procedure
        return executeTransaction('Search_User', [
            searchTerm,
            slot_wise,
            batch_wise,
            course_id,
            hod_only
        ]);
    },
    Get_Dashboard: async function () {

        return getmultipleSP('Get_Dashboard', []);
    },
    Get_Dashboard_Course_Wise_Monthly_Enrollment: async function () {
        const sql = `
            SELECT
                c.Course_Name,
                MONTHNAME(COALESCE(sc.Enrollment_Date, s.Admission_Date)) AS Month,
                COUNT(DISTINCT sc.Student_ID) AS Student_Count
            FROM course c
            INNER JOIN student_course sc
                ON c.Course_ID = sc.Course_ID
            INNER JOIN student s
                ON s.Student_ID = sc.Student_ID
            WHERE (c.Delete_Status IS NULL OR c.Delete_Status = 0)
              AND (sc.Delete_Status IS NULL OR sc.Delete_Status = 0)
              AND (s.Delete_Status IS NULL OR s.Delete_Status = 0)
              AND (sc.Expiry_Date IS NULL OR DATE(sc.Expiry_Date) >= CURDATE())
              AND COALESCE(sc.Enrollment_Date, s.Admission_Date) IS NOT NULL
            GROUP BY
                c.Course_ID,
                c.Course_Name,
                MONTH(COALESCE(sc.Enrollment_Date, s.Admission_Date)),
                MONTHNAME(COALESCE(sc.Enrollment_Date, s.Admission_Date))
            ORDER BY
                c.Course_Name,
                MONTH(COALESCE(sc.Enrollment_Date, s.Admission_Date));
        `;

        const [rows] = await db.promise().query(sql);
        return rows;
    },
    Get_courses: async function (student_Id_) {
        return executeTransaction('GetCoursesByUserId', [student_Id_]);
    },
    Get_Calls_And_Chats_List: async function (type, sender, teacherId, studentId) {
        return executeTransaction('Get_Calls_And_Chats_List', [type, sender, teacherId, studentId]);
    },
    Logout_User: async function (userId, isStudent) {
        return executeTransaction('Logout_User', [userId, isStudent]);
    },
    get_call_history: async function (studentId, teacherId) {
        console.log('studentId:s ', studentId);
        console.log('teacherId: ', teacherId);
        return executeTransaction('get_call_history', [studentId, teacherId]);
    },
    Get_Ongoing_Calls: async function (userId, isStudent) {
        console.log('isStudent: ', isStudent);
        console.log('userId: ', userId);

        return executeTransaction('Get_Ongoing_Calls', [userId, isStudent]);
    },
    Get_Completed_Live_Class: async function (userId) {
        console.log('userId: ', userId);
        return executeTransaction('Get_Completed_liveClass', [userId]);
    },
    Get_Report_StudentLiveClasses_By_BatchAndStudent: async function (
        studentId,
        Batch_ID,
        Course_ID,
        Start_Date,
        End_Date,
        page,
        pageSize
    ) {
        studentId = studentId || 0;
        Batch_ID = Batch_ID || 0;
        Course_ID = Course_ID || 0;
        Start_Date = Start_Date || '';
        End_Date = End_Date || '';
        page = page || 1;
        pageSize = pageSize || 25;

        return getmultipleSP('Get_Report_StudentLiveClasses_By_BatchAndStudent', [
            studentId,
            Batch_ID,
            Course_ID,
            Start_Date,
            End_Date,
            page,
            pageSize
        ]);
    },
    Get_Report_Student: async function (
        studentSearch,
        batchSearch,
        courseSearch,
        fromDate,
        toDate,
        page,
        pageSize
    ) {
        studentSearch = studentSearch || '';
        batchSearch = batchSearch || '';
        courseSearch = courseSearch || '';
        fromDate = fromDate || '';
        toDate = toDate || '';
        page = page || 1;
        pageSize = pageSize || 10;

        return getmultipleSP('Get_Report_Student', [
            studentSearch,
            batchSearch,
            courseSearch,
            1,
            fromDate,
            toDate,
            page,
            pageSize
        ]);
    },
    Get_Outstanding_Student: async function (
        studentId,
        Batch_ID,
        Course_ID,
        Start_Date,
        End_Date,
        page,
        pageSize
    ) {
        console.log("11111", studentId,
            Batch_ID,
            Course_ID,
            Start_Date,
            End_Date,
            page,
            pageSize);

        studentId = studentId || 0;
        Batch_ID = Batch_ID || 0;
        Course_ID = Course_ID || 0;
        Start_Date = Start_Date || '';
        End_Date = End_Date || '';
        page = page || 1;
        pageSize = pageSize || 10;

        return getmultipleSP('Get_Outstanding_Student', [
            studentId,
            Batch_ID,
            Course_ID,
            1,
            Start_Date,
            End_Date,
            page,
            pageSize
        ]);
    },
    Get_upcomming_installments: async function (
        studentId,
        Batch_ID,
        Course_ID,
        Start_Date,
        End_Date,
        page,
        pageSize
    ) {
        studentId = studentId || 0;
        Batch_ID = Batch_ID || 0;
        Course_ID = Course_ID || 0;
        Start_Date = Start_Date || '';
        End_Date = End_Date || '';
        page = page || 1;
        pageSize = pageSize || 10;

        return getmultipleSP('Get_upcomming_installments', [
            studentId,
            Batch_ID,
            Course_ID,
            1,
            Start_Date,
            End_Date,
            page,
            pageSize
        ]);
    },
    Get_Due_installments: async function (
        studentId,
        Batch_ID,
        Course_ID,
        Start_Date,
        End_Date,
        page,
        pageSize
    ) {
        studentId = studentId || 0;
        Batch_ID = Batch_ID || 0;
        Course_ID = Course_ID || 0;
        Start_Date = Start_Date || '';
        End_Date = End_Date || '';
        page = page || 1;
        pageSize = pageSize || 10;

        return getmultipleSP('Get_Due_installments', [
            studentId,
            Batch_ID,
            Course_ID,
            Start_Date,
            End_Date,
            pageSize,
            page
        ]);
    },
    Get_Report_TeacherLiveClasses_By_BatchAndTeacher: async function (
        Teacher_ID,
        Batch_ID,
        Course_ID,
        Start_Date,
        End_Date,
        page,
        pageSize
    ) {
        Teacher_ID = Teacher_ID || 0;
        Batch_ID = Batch_ID || 0;
        Course_ID = Course_ID || 0;
        Start_Date = Start_Date || '';
        End_Date = End_Date || '';
        page = page || 1;
        pageSize = pageSize || 25;

        return getmultipleSP('Get_Report_TeacherLiveClasses_By_BatchAndTeacher', [
            Teacher_ID,
            Batch_ID,
            Course_ID,
            Start_Date,
            End_Date,
            page,
            pageSize
        ]);
    },

    Get_Hod_Course: async function (userId) {

        return executeTransaction('Get_Hod_Course', [userId]);
    },
    Get_Report_LiveClasses_By_BatchAndTeacher: async function (Teacher_ID, Batch_ID, Course_ID, Start_Date, End_Date) {
        if (!End_Date) {

            console.log('End_Date: ', End_Date);
            console.log('Start_Date: ', Start_Date);
        } !Teacher_ID ? Teacher_ID = 0 : Teacher_ID;
        !Batch_ID ? Batch_ID = 0 : Batch_ID;
        !Course_ID ? Course_ID = 0 : Course_ID;
        !Start_Date ? Start_Date = '' : Start_Date;
        !End_Date ? End_Date = '' : End_Date;
        console.log('End_Date: ', End_Date);

        return executeTransaction('Get_Report_LiveClasses_By_BatchAndTeacher', [Teacher_ID, Batch_ID, Course_ID, Start_Date, End_Date]);
    },
    Get_User_Email_Number: async function (user_Id) {
        return executeTransaction('Get_User_Email_Number', [
            user_Id
        ]);

    },
    Check_Call_Availability: async function (user_Id, is_Student) {
        return executeTransaction('Check_Call_Availability', [
            user_Id, is_Student
        ]);

    },

    update_user_status: async function (user_Id, status) {
        status = status == 'true' ? 1 : 0
        return executeTransaction('update_user_status', [
            user_Id, status
        ]);

    },
    Search_User_Invoice: async function (user_Id) {
        return executeTransaction('Search_User_Invoice', [
            user_Id
        ]);

    },
    Delete_Invoice: async function (Invoice_Id) {
        return executeTransaction('Delete_Invoice', [
            Invoice_Id
        ]);

    },
    Save_User_Invoice: async function (data) {
        return executeTransaction('Save_User_Invoice', [
            data.Invoice_Id,
            data.invoice_date,
            data.name,
            data.position,
            data.course_name,
            data.payment_period,
            data.class_hours,
            data.total_amount,
            data.approved_by,
            data.user_Id,
            data.Course_Id
        ]);
    },
    get_onetoone_Recordings: async function (studentId) {
        return executeTransaction('Get_OneToOne_Recordings', [studentId]);
    },
    Report_User: async function (reportData) {
        return executeTransaction('Report_User', [
            reportData.reporter_id,
            reportData.reported_user_id,
            reportData.chat_id || null,  // Optional chat message reporting
            reportData.report_reason
        ]);
    },
    Get_Blocked_User: async function (user_id) {
        return executeTransaction('Get_Blocked_User', [user_id]);
    },
    Block_User: async function (blockData) {
        return executeTransaction('Block_User', [
            blockData.blocker_id,
            blockData.blocked_user_id,
            blockData.Is_Student_Blocked
        ]);
    },
    Unblock_User: async function (blockData) {
        return executeTransaction('Unblock_User', [
            blockData.blocker_id,
            blockData.blocked_user_id
        ]);
    },
    Check_User_Blocked_Status: async function (blocker_id, blocked_user_id) {
        return executeTransaction('Check_User_Blocked_Status', [
            blocker_id,
            blocked_user_id
        ]);
    }
    // get_chat_call_history: async function (student_Id_,teacher_Id_) {
    //     return executeTransaction('get_chat_call_history', [student_Id_,teacher_Id_]);
    // },
};
module.exports = user;
