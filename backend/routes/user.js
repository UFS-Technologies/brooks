var express = require('express');
var router = express.Router();
var user = require('../models/user');
var Login = require('../models/Login');
const { subscribeToTopic, sendNotifToTopic, sendAppleNotification } = require('../helpers/firebase');
const { executeTransaction, getmultipleSP } = require('../helpers/sp-caller');
const nodemailer = require("nodemailer");
const student = require('../models/student');
let debounceTimeout;

const axios = require('axios');

router.post('/Save_user/', async (req, res, next) => {
  try {
    const result = await user.Save_user(req.body);
    console.log('Saved User Data:', result);

    if (req.body.User_ID == 0) {
      let emailBody = `
                 <html>
                     <body style="font-family: Arial, sans-serif; color: #333;">
                         <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                             <h2 style="text-align: center; color: #4CAF50;">Welcome to IGM Academy!</h2>
                             <p>Dear ${req.body['First_Name']} ${req.body['Last_Name']},</p>
                             <p>Welcome to IGM Academy! Your teacher account has been successfully created.</p>
                             
                             <h3>Account Details:</h3>
                             <ul>
                                 <li><strong>Username/Email:</strong> ${req.body['Email']}</li>
                             </ul>
 
                             <h3>Next Steps:</h3>
                             <p>Login to your account using the app and set your password.</p>
 
                             <h3>For Support:</h3>
                             <ul>
                                 <li>Email: <a href="mailto:info@IGMacademy.in" style="color: #4CAF50; text-decoration: none;">info@IGMacademy.in</a></li>
                             </ul>
 
                             <p style="font-size: 0.9em; color: #888;">Note: This is an automated email. Please do not reply.</p>
                             <p style="text-align: center; font-weight: bold;">Best regards,</p>
                             <p style="text-align: center;">Team IGM Academy</p>
                         </div>
                     </body>
                 </html>
             `;

      const emailPayload = {
        sender: {
          name: 'IGM Academy',
          email: 'info@IGMacademy.in'
        },
        to: [{
          email: req.body['Email']
        }],
        subject: 'Welcome to IGM Academy - Teacher Account Created Successfully',
        htmlContent: emailBody
      };

      let attempts = 0;
      let maxAttempts = 3;
      let emailSent = false;

      while (!emailSent && attempts < maxAttempts) {
        try {
          const emailResponse = await axios({
            method: 'post',
            url: 'https://api.brevo.com/v3/smtp/email',
            headers: {
              'accept': 'application/json',
              'api-key': process.env.BREVO_API_KEY,
              'content-type': 'application/json'
            },
            data: emailPayload
          });
          console.log('Email sent successfully:', emailResponse.data);
          emailSent = true;
        } catch (error) {
          attempts++;
          console.log(`Attempt ${attempts} failed:`, error.message);
          if (attempts >= maxAttempts) {
            console.log('Email sending failed after maximum attempts.');
          }
        }
      }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, error: error.message });
  }
});

router.post('/Save_StudentLiveClass/', async (req, res, next) => {
  try {
    console.log('req.body: ', req.body);
    const rows = await user.Save_StudentLiveClass(req.body);
    res.json(rows);
  }
  catch (e) {
    res.status(500).json({ success: false, message: e.message, error: e.message });
  }
});

router.post('/Save_Call_History/', async (req, res) => {
  try {
    const { Is_Student_Called, teacher_id, student_id, is_call_rejected, Live_Link, call_type } = req.body;
    console.log('Request body:', req.body);
    const id = Is_Student_Called ? teacher_id : student_id;
    const isTeacher = !Is_Student_Called;
    const userTopic = `${isTeacher ? 'TCR-' : 'STD-'}${isTeacher ? teacher_id : student_id}`;
    const otherUserTopic = `${isTeacher ? 'STD-' : 'TCR-'}${id}`;


    console.log('User topics:', { userTopic, otherUserTopic });
    // const deviceId= await executeTransaction('Get_DeviceId_By_UserId', [ id,Is_Student_Called]);

    const [callHistory] = await user.Save_Call_History(req.body);

    const [userData] = await executeTransaction('Get_Profile_Photo', [Is_Student_Called, Is_Student_Called ? student_id : teacher_id]);
    const photo = userData?.Profile_Photo_Path || '';

    console.log('is_call_rejected: ', is_call_rejected);
    if (is_call_rejected) {
      clearTimeout(debounceTimeout);

      debounceTimeout = setTimeout(async () => {
        const result = await executeTransaction('Update_Call_Status', [req.body.id, 'reject', 1, id, Is_Student_Called]);

        const [StudentOngoingCalls, TeacherOngoingCalls] = await Promise.all([
          executeTransaction('Get_Ongoing_Calls', [student_id, Is_Student_Called]),
          executeTransaction('Get_Ongoing_Calls', [teacher_id, !Is_Student_Called])
        ]);
        req.io.to(otherUserTopic).emit('Call_Status', req.body);
        req.io.to(`STD-${student_id}`).emit('Get_Ongoing_Calls', StudentOngoingCalls);
        req.io.to(`TCR-${teacher_id}`).emit('Get_Ongoing_Calls', TeacherOngoingCalls);
      }, 200)
    } else {
      console.log('isTeacher: ', isTeacher);
      console.log('id: ', id);
      const ongoingCalls = await executeTransaction('Get_Ongoing_Calls', [id, isTeacher]);


      req.io.to(otherUserTopic).emit('Get_Ongoing_Calls', ongoingCalls);

    }

    if (callHistory.Is_Finished == 0) {

      const notificationData = {
        type: 'new_call',
        sender_id: String(Is_Student_Called ? student_id : teacher_id),
        receiver_id: String(Is_Student_Called ? teacher_id : student_id),
        message_content: 'New Call',
        timestamp: new Date().toISOString(),
        Live_Link: String(Live_Link),
        call_type: String(call_type),
        Profile_Photo_Img: String(photo),
        id: String(callHistory.id),
        Caller_Name: String(userData.Full_Name),
      };
      const extraData = {
        extra: {
          Live_Link: String(Live_Link),
          type: "new_call",
          teacher_id: String(Is_Student_Called ? '' : teacher_id),
          student_id: String(Is_Student_Called ? student_id : ''),
          id: String(callHistory.id),
          call_type: String(call_type),
          profile_url: String(photo),
          teacher_name: String(Is_Student_Called ? '' : userData.Full_Name),
          student_name: String(Is_Student_Called ? userData.Full_Name : ''),
          Caller_Name: String(userData.Full_Name),
          handle: "+1234567890",
          Is_Student_Called: Is_Student_Called

        }
      };
      const [user_app_Info] = await student.Get_AppInfo(!Is_Student_Called, id);
      console.log('user_app_Info: ', user_app_Info);

      await sendNotifToTopic(otherUserTopic, "Incoming Call", `${userData.Full_Name} Is Trying To Connect You`, notificationData);
      if (user_app_Info[0].devicePushTokenVoip && (user_app_Info[0].manufacturer == 'iPhone' || user_app_Info[0].manufacturer == 'iPad')) {
        await sendAppleNotification(user_app_Info[0].devicePushTokenVoip, "Incoming Call", "Incoming call from caller", extraData);
      }


    }

    res.json([callHistory]);
  } catch (error) {
    console.error('Error in Save_Call_History:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/Search_user/', async (req, res, next) => {
  try {
    const {
      user_Name,           // Search term
      slot_wise,          // Filter for slot-wise teachers
      batch_wise,         // Filter for batch-wise teachers
      course_id,          // Filter by course ID
      hod_only           // Filter for HODs
    } = req.query;

    // Convert string values to appropriate types
    const params = {
      user_Name: user_Name || '',
      slot_wise: slot_wise === 'true' ? true : (slot_wise === 'false' ? false : null),
      batch_wise: batch_wise === 'true' ? true : (batch_wise === 'false' ? false : null),
      course_id: course_id ? parseInt(course_id) : null,
      hod_only: hod_only === 'true' ? true : (hod_only === 'false' ? false : null)
    };

    const rows = await user.Search_user(params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Failed to search user',
      error: e.message
    });
  }
});
router.get('/Get_Dashboard/', async (req, res, next) => {
  try {
    const rows = await user.Get_Dashboard();
    const courseWiseMonthlyEnrollment = await user.Get_Dashboard_Course_Wise_Monthly_Enrollment();

    if (Array.isArray(rows)) {
      rows[3] = courseWiseMonthlyEnrollment;
    }

    res.json(rows);
  }
  catch (e) {
    res.status(500).json({ success: false, message: 'Failed to search Get_Dashboard', error: e.message });
  }
});
router.get('/Get_user/:user_Id_?', async (req, res, next) => {
  try {
    const rows = await user.Get_user(req.params.user_Id_);
    res.json([rows]);
  }
  catch (e) {
    res.status(500).json({ success: false, message: 'Failed to get user', error: e.message });
  }
});
router.get('/Delete_user/:user_Id_?', async (req, res, next) => {
  try {
    const rows = await user.Delete_user(req.params.user_Id_);
    res.json(rows);
  }
  catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete user', error: e.message });
  }
});
// Get_All_Menu_Permissions
router.get('/Get_All_Menu_Permissions/:user_Id_?', async (req, res, next) => {
  try {
    const rows = await user.Get_All_Menu_Permissions(req.params.user_Id_);

    res.json(rows);
  }
  catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete user', error: e.message });
  }
});

router.get('/Get_user_Menus/:user_Id_?', async (req, res, next) => {
  try {

    const rows = await user.Get_user_Menus(req.userId);

    res.json(rows);
  }
  catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete user', error: e.message });
  }
});

router.get('/Get_courses/:user_Id_?', async (req, res, next) => {
  try {
    const rows = await user.Get_courses(req.params.user_Id_);
    res.json(rows);
  }
  catch (e) {
    res.status(500).json({ success: false, message: 'Failed to get courses', error: e.message });
  }
});
router.get('/get_call_history/:studentId?/:teacherId?', async (req, res, next) => {
  try {
    console.log('req: ', req);
    const rows = await user.get_call_history(req.params.studentId, req.params.teacherId);
    console.log('req.params.teacherId: ', req.params.teacherId);
    console.log('req.params.studentId: ', req.params.studentId);
    res.json(rows);
  }
  catch (e) {
    res.status(500).json({ success: false, message: 'Failed to get courses', error: e.message });
  }
});
router.get('/Get_Calls_And_Chats_List', async (req, res, next) => {
  try {
    const { type, sender, teacherId, studentId } = req.query;

    const rows = await user.Get_Calls_And_Chats_List(type, sender, teacherId, studentId);
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: { message: 'An error occurred while processing your request.' } });
  }
});
router.post('/Logout_User', async (req, res, next) => {
  try {


    console.log('req.userId: ', req.userId);
    console.log(' req.isStudent : ', req.isStudent);
    const rows = await user.Logout_User(req.userId, req.isStudent);
    console.log('rows: ', rows);
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: { message: 'An error occurred while processing your request.' } });
  }
});
router.post('/Get_Ongoing_Calls', async (req, res, next) => {
  try {
    // for teacher list req.body.isStudent will be 0


    if (req.body.callId > 0) {

      const Call_Details = await user.Update_Call_Status(req.body.callId, 'ring', req.body.isOnAnotherCall);

      const id = req.body.isStudent ? Call_Details[0].teacher_id : Call_Details[0].student_id
      const otherUserTopic = `${req.body.isStudent ? 'TCR-' : 'STD-'}${id}`;

      const response = { ...Call_Details[0], isOnAnotherCall: req.body.isOnAnotherCall }

      req.io.to(otherUserTopic).emit('isCallConnected', response






      );

    }



    const rows = await user.Get_Ongoing_Calls(req.userId, req.body.isStudent ? req.body.isStudent : 0);
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: { message: 'An error occurred while processing your request.' } });
  }
});



router.get('/Update_Call_Status', async (req, res, next) => {
  try {
    const { callId, type, newStatus, isStudent } = req.query;



    const userId = req.userId ? Number(req.userId) : null;
    const status = newStatus ? Number(newStatus) : 0;
    const isStudentStatus = isStudent ? 1 : 0;

    if (!userId) {
      return res.status(400).json({ errors: { message: 'User ID is missing or invalid.' } });
    }

    const callDetails = await user.Update_Call_Status(callId ? Number(callId) : 0, type, status, userId, isStudentStatus);
    console.log('callDetails: ', callDetails);

    res.json(callDetails[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: { message: 'An error occurred while processing your request.' } });
  }
});

router.get('/Get_Report_TeacherLiveClasses_By_BatchAndTeacher', async (req, res, next) => {
  try {
    const { Teacher_ID, Batch_ID, Course_ID, fromDate, toDate, page = 1, PageSize = 25 } = req.query;
    console.log('PageSize: ', PageSize);
    console.log('page: ', page);

    const rows = await user.Get_Report_TeacherLiveClasses_By_BatchAndTeacher(
      Teacher_ID,
      Batch_ID,
      Course_ID,
      fromDate,
      toDate,
      parseInt(page),
      parseInt(PageSize)
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: { message: 'An error occurred while processing your request.' } });
  }
});

router.get('/Get_Report_StudentLiveClasses_By_BatchAndStudent', async (req, res, next) => {
  try {
    const { Student_ID, Batch_ID, Course_ID, Start_Date, End_Date, PageNumber = 1, PageSize = 25 } = req.query;

    const rows = await user.Get_Report_StudentLiveClasses_By_BatchAndStudent(
      Student_ID,
      Batch_ID,
      Course_ID,
      Start_Date,
      End_Date,
      parseInt(PageNumber),
      parseInt(PageSize)
    );
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: { message: 'An error occurred while processing your request.' } });
  }
});
// Get_Report_Student
router.get('/Get_Report_Student', async (req, res, next) => {
  try {
    const { Student_Search, Batch_Search, Course_Search, Start_Date, End_Date, PageNumber = 1, PageSize = 25 } = req.query;

    const rows = await user.Get_Report_Student(
      Student_Search,
      Batch_Search,
      Course_Search,
      Start_Date,
      End_Date,
      parseInt(PageNumber),
      parseInt(PageSize)
    );
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: { message: 'An error occurred while processing your request.' } });
  }
});
router.get('/Get_Outstanding_Student', async (req, res, next) => {
  try {
    const { Student_ID, Batch_ID, Course_ID, Start_Date, End_Date, PageNumber = 1, PageSize = 25 } = req.query;

    const rows = await user.Get_Outstanding_Student(
      Student_ID,
      Batch_ID,
      Course_ID,
      Start_Date,
      End_Date,
      parseInt(PageNumber),
      parseInt(PageSize)
    );
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: { message: 'An error occurred while processing your request.' } });
  }
});
// Get_Due_installments
router.get('/Get_Due_installments', async (req, res, next) => {
  try {
    const { Student_ID, Batch_ID, Course_ID, Start_Date, End_Date, PageNumber = 1, PageSize = 25 } = req.query;

    const rows = await user.Get_Due_installments(
      Student_ID,
      Batch_ID,
      Course_ID,
      Start_Date,
      End_Date,
      parseInt(PageNumber),
      parseInt(PageSize)
    );
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: { message: 'An error occurred while processing your request.' } });
  }
});
// Get_upcomming_installments
router.get('/Get_upcomming_installments', async (req, res, next) => {
  try {
    const { Student_ID, Batch_ID, Course_ID, Start_Date, End_Date, PageNumber = 1, PageSize = 25 } = req.query;

    const rows = await user.Get_upcomming_installments(
      Student_ID,
      Batch_ID,
      Course_ID,
      Start_Date,
      End_Date,
      parseInt(PageNumber),
      parseInt(PageSize)
    );
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: { message: 'An error occurred while processing your request.' } });
  }
});
router.get('/Get_Hod_Course', async (req, res, next) => {
  try {

    const rows = await user.Get_Hod_Course(req.query.userId ? req.query.userId : req.userId);
    console.log('rows: ', rows);
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: { message: 'An error occurred while processing your request.' } });
  }
});

router.get('/Get_Report_LiveClasses_By_BatchAndTeacher', async (req, res, next) => {
  try {
    const { Teacher_ID, Batch_ID, Course_ID, Start_Date, End_Date } = req.query;

    const rows = await user.Get_Report_LiveClasses_By_BatchAndTeacher(Teacher_ID, Batch_ID, Course_ID, Start_Date, End_Date);
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: { message: 'An error occurred while processing your request.' } });
  }
});
router.get('/Check_Call_Availability', async (req, res, next) => {
  try {
    const { user_Id, is_Student_Calling } = req.query;

    const rows = await user.Check_Call_Availability(user_Id, is_Student_Calling);
    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: { message: 'An error occurred while processing your request.' } });
  }
});

router.post('/update_user_status/', async (req, res, next) => {
  try {
    const rows = await user.update_user_status(req.userId, req.query.status);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to search course', error: e.message });
  }
});
router.get('/Search_User_Invoice/:user_Id_?', async (req, res, next) => {
  try {
    const rows = await user.Search_User_Invoice(req.params.user_Id_);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to search course', error: e.message });
  }
});
router.post('/Save_User_Invoice/', async (req, res, next) => {
  try {
    const rows = await user.Save_User_Invoice(req.body);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to search course', error: e.message });
  }
});
router.get('/Delete_Invoice/:Invoice_Id?', async (req, res, next) => {
  try {
    const rows = await user.Delete_Invoice(req.params.Invoice_Id);
    res.json(rows);
  }
  catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete user', error: e.message });
  }
});

router.get('/get_onetoone_Recordings', async (req, res, next) => {
  try {
    console.log('req.userId: ', req.userId);
    const rows = await user.get_onetoone_Recordings(req.userId);
    res.json(rows);
  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Failed to get recordings',
      error: e.message
    });
  }
});

router.post('/Report_User', async (req, res, next) => {


  try {
    const rows = await user.Report_User(req.body);
    res.json({ success: true, message: 'User reported successfully', data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to report user', error: e.message });
  }
});
router.post('/Unblock_User', async (req, res, next) => {
  try {
    const rows = await user.Unblock_User(req.body);
    console.log('req.body: ', req.body);

    res.json({ success: true, message: 'User unblocked successfully', data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to unblock user', error: e.message });
  }
});
router.get('/Get_Blocked_User/', async (req, res, next) => {
  try {
    const rows = await user.Get_Blocked_User(req.userId);
    console.log('req.userId: ', req.userId);
    res.json({ success: true, message: 'Blocked users retrieved successfully', data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to retrieve blocked users', error: e.message });
  }
});
router.post('/Block_User', async (req, res, next) => {
  try {
    const rows = await user.Block_User(req.body);
    console.log('req.body: ', req.body);
    res.json({ success: true, message: 'User blocked successfully', data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to block user', error: e.message });
  }
});
router.get('/Check_User_Blocked_Status/:blocked_user_id', async (req, res, next) => {
  try {
    const rows = await user.Check_User_Blocked_Status(req.userId, req.params.blocked_user_id);
    const result = rows.length > 0 ? rows[0] : { has_blocked: 0, has_been_blocked: 0 };

    res.json({
      success: true,
      message: 'Block status retrieved',
      has_blocked: result.has_blocked > 0,
      has_been_blocked: result.has_been_blocked > 0
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to check block status', error: e.message });
  }
});

router.post('/Save_Leave', async (req, res, next) => {
  try {
    const rows = await user.Save_Leave(req.body);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to save leave', error: e.message });
  }
});

router.get('/Get_Leaves/:user_Id?', async (req, res, next) => {
  try {
    const rows = await user.Get_Leaves(req.params.user_Id || 0);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to get leaves', error: e.message });
  }
});

router.get('/Delete_Leave/:leave_Id', async (req, res, next) => {
  try {
    const rows = await user.Delete_Leave(req.params.leave_Id);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to delete leave', error: e.message });
  }
});

module.exports = router;  
