var express = require('express');
var router = express.Router();
var student = require('../models/student');
const nodemailer = require("nodemailer");
const axios = require('axios');
const emailHelper = require('../helpers/email-helper');
const emailLog = require('../models/email_log');

// Send_Bulk_Email
router.post('/Send_Bulk_Email', async (req, res, next) => {
    try {
        const { students, subject, body, templateId } = req.body;
        console.log('Send_Bulk_Email received for', students?.length, 'students');

        if (!students || students.length === 0) {
            return res.status(400).json({ success: false, message: 'No students provided.' });
        }

        // Loop and send email
        for (const student of students) {
            if (student.Email) {
                try {
                    await emailHelper.sendEmail(student.Email, subject, body.replace(/\n/g, '<br>'));
                    await emailLog.Save_Email_Log(student.Student_ID, templateId || null, student.Email, subject, body, 'Success', null);
                } catch (emailError) {
                    console.error('Error sending email to', student.Email, emailError);
                    await emailLog.Save_Email_Log(student.Student_ID, templateId || null, student.Email, subject, body, 'Failed', emailError.message || String(emailError));
                }
            } else {
                await emailLog.Save_Email_Log(student.Student_ID, templateId || null, null, subject, body, 'Failed', 'No email address');
            }
        }

        res.json({ success: true, message: 'Bulk email sent successfully' });
    } catch (e) {
        console.error('Send_Bulk_Email error:', e);
        res.status(500).json({ success: false, message: 'Failed to send bulk emails', error: e.message });
    }
});

// Get_Mail_Report
router.get('/Get_Mail_Report', async (req, res, next) => {
    try {
        let { fromDate, toDate, templateId } = req.query;
        
        // Ensure the entire end day is included by appending time
        if (toDate && toDate.trim() !== '') {
            toDate = `${toDate} 23:59:59`;
        }
        
        const rows = await emailLog.Get_Mail_Report(fromDate, toDate, templateId);
        res.json(rows);
    } catch (e) {
        console.error('Get_Mail_Report error:', e);
        res.status(500).json({ success: false, message: 'Failed to get mail report', error: e.message });
    }
});

// Get_Email_Logs_By_Student
router.get('/Get_Email_Logs_By_Student/:student_Id?', async (req, res, next) => {
    try {
        const rows = await emailLog.Get_Email_Logs_By_Student(req.params.student_Id);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get email logs', error: e.message });
    }
});

// Registration_Using_Student_Branch
router.post('/Registration_Using_Student_Branch', async (req, res, next) => {
    try {
        console.log("req.body: ", req.body);
        
        const rows = await student.Registration_Using_Student_Branch(req.body);       
        res.json(rows[0]);
    } catch (error) {       
        res.status(500).json({ error: 'Internal Server Error', message: error.sqlMessage });
    }
});

router.post('/Check_Uniqueness', async (req, res, next) => {
    try {
        const result = await student.Check_Uniqueness(req.body);
        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to check uniqueness', error: e.message });
    }
});
// Remove_Student_Registration
router.post('/Remove_Student_Registration', async (req, res, next) => {
    try {
        console.log("req.body: ", req.body);
        
        const rows = await student.Remove_Student_Registration(req.body);       
        res.json(rows[0]);
    } catch (error) {       
        res.status(500).json({ error: 'Internal Server Error', message: error.sqlMessage });
    }
});
// Get_All_Enquiry
router.get('/Get_All_Enquiry', async (req, res, next) => {
    try {
        const rows = await student.Get_All_Enquiry();
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to search student', error: e.message });
    }
});

router.post('/Save_Enquiry_Source/', async (req, res, next) => {
    try {
        const rows = await student.Save_Enquiry_Source(req.body);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to save enquiry source', error: e.message });
    }
});

router.post('/Delete_Enquiry_Source/', async (req, res, next) => {
    try {
        const rows = await student.Delete_Enquiry_Source(req.body.Enquiry_Source_Id);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to delete enquiry source', error: e.message });
    }
});
router.post('/Save_student/', async (req, res, next) => {
    try {
        
        const rows = await student.Save_student(req.body);
        console.log('rrows[0 ', rows[0]['existingUser']==0);
        if(rows[0]['existingUser']==0){
            if(req.body['Email']!='' && req.body['Email']) {
                try {
                    const response = await axios({
                        method: 'post',
                        url: 'https://api.brevo.com/v3/smtp/email',
                        headers: {
                            'accept': 'application/json',
                            'api-key': process.env.BREVO_API_KEY,
                            'content-type': 'application/json'
                        },
                        data: {
                            sender: {
                                name: 'IGM Academy',
                                email: 'info@IGMacademy.in'
                            },
                            to: [{
                                email: req.body['Email']
                            }],
                            subject: 'Welcome to Track Box - Student Account Created Successfully',
                            htmlContent: `
                                <html>
                                    <body style="font-family: Arial, sans-serif; color: #333;">
                                        <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                                            <h2 style="text-align: center; color: #4CAF50;">Welcome to Track Box!</h2>
                                            <p>Dear ${req.body['First_Name']} ${req.body['Last_Name']},</p>
                                            <p>Welcome to IGM Academy! Your student account has been successfully created.</p>
                                            
                                            <h3>Account Details:</h3>
                                            <ul>
                                                <li><strong>Username/Email:</strong> ${req.body['Email']}</li>
                                            </ul>
                                            
                                            <h3>Next Steps:</h3>
                                            <p>Download the Track Box Student App:</p>
                                            <ul>
                                                <li><a href="[Play Store Link]" style="color: #4CAF50; text-decoration: none;">Android: Play Store</a></li>
                                            </ul>
                                            
                                            <h3>Login Instructions:</h3>
                                            <ul>
                                                <li>Open the app</li>
                                                <li>Enter your email and enter OTP</li>
                                            </ul>
                                            
                                            <h3>Important Notes:</h3>
                                            <p>Please enable notifications to stay updated with your classes.</p>
                                            
                                            <h3>For any assistance, please contact us:</h3>
                                            <ul>
                                                <li>Email: <a href="mailto:info@IGMacademy.in" style="color: #4CAF50; text-decoration: none;">info@IGMacademy.in</a></li>
                                            </ul>
                                            
                                            <p style="font-size: 0.9em; color: #888;">Note: This is an automated email. Please do not reply.</p>
                                            
                                            <p style="text-align: center; font-weight: bold;">Best regards,</p>
                                            <p style="text-align: center;">Team IGM Academy</p>
                                        </div>
                                    </body>
                                </html>
                            `
                        }
                    });
                } catch (error) {
                    console.error('Error sending welcome email:', error);
                    // Continue with the response even if email fails
                }
            }
        }
        res.json(rows);
    }
    catch (e) {
        console.log('e: ', e);
        res.status(500).json({ success: false, message: 'Failed to save student', error: e.message });
    }
});
// Save_User_Permission
router.post('/Save_User_Permission/', async (req, res) => {
    try {
        const rows = await student.Save_User_Permission(req.body);
        console.log("rows",rows);
        
        res.json({ success: true, data: rows });
    } catch (e) {
        console.error('Error in Save_student_followup:', e);
        res.status(500).json({ success: false, message: 'Failed to save follow-up', error: e.message });
    }
});
router.post('/Save_student_followup/', async (req, res) => {
    try {
        if (!req.body.Created_By) {
            req.body.Created_By = req.userId;
        }
        const rows = await student.Save_student_followup(req.body);
        res.json({ success: true, data: rows });
    } catch (e) {
        console.error('Error in Save_student_followup:', e);
        res.status(500).json({ success: false, message: 'Failed to save follow-up', error: e.message });
    }
});
router.post('/enroleCourse/', async (req, res, next) => {
    try {
        console.log('req.body: ', req.body);
        const rows = await student.enroleCourse(req.body);
        res.json(rows);
        console.log('rows: ', rows);

        let transporter = nodemailer.createTransport({
            host: "smtp-relay.brevo.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: "7a9d83001@smtp-brevo.com", // generated brevo user
                pass: "2bNEKDBCd7JytLIH", // generated brevo password
            },
            tls: {
                rejectUnauthorized: true
            }
        });

        const recepients = ["work@ufstechnologies.com", "cristine@ufstechnologies.com" ]
        
        const msg = {
            from: "info@IGMacademy.in",
            to: recepients,
            subject: 'New Student Enrolled',
            html: `
            
            <br/>Hello, <br/>
            <p>A new student has enrolled. Below are the details:</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Student Name</th>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${rows[0].student_Name_}</td>
            </tr>
            <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Course Name</th>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${rows[0].course_Name_}</td>
            </tr>
      
            </table>
            <br/>`,


        };

        const sendMailPromise = () => {
            return new Promise((resolve, reject) => {
                transporter.sendMail(msg, function (err, info) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(info);
                    }
                });
            });
        };


        await sendMailPromise();
    }
    catch (e) {
        console.log('e: ', e);
        res.status(500).json({ success: false, message:  e.message, error: e.message });
    }
});
router.post('/Buy_Course/', async (req, res, next) => {
    try {
        const rows = await student.Buy_Course(req.body);
        res.json(rows);
        console.log('rows: ', rows);

        let transporter = nodemailer.createTransport({
            host: "smtp-relay.brevo.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: "7a9d83001@smtp-brevo.com", // generated brevo user
                pass: "2bNEKDBCd7JytLIH", // generated brevo password
            },
            tls: {
                rejectUnauthorized: true
            }
        });

        const recepients = ["work@ufstechnologies.com", "cristine@ufstechnologies.com" ]
        
        const msg = {
            from: "info@IGMacademy.in",
            to: recepients,
            subject: 'New Student Enrolled',
            html: `
            
            <br/>Hello, <br/>
            <p>A new student has enrolled. Below are the details:</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Student Name</th>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${rows[0].student_Name_}</td>
            </tr>
            <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Course Name</th>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${rows[0].course_Name_}</td>
            </tr>
      
            </table>
            <br/>`,


        };

        const sendMailPromise = () => {
            return new Promise((resolve, reject) => {
                transporter.sendMail(msg, function (err, info) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(info);
                    }
                });
            });
        };


        // await sendMailPromise();
    }
    catch (e) {
        console.log('e: ', e);
        res.status(500).json({ success: false, message:  e.message, error: e.message });
    }
});
router.post('/enroleCourseFromAdmin/', async (req, res, next) => {
    try {
        console.log('req.body: of enroleCourseFromAdmin', req.body);
        const rows = await student.enroleCourseFromAdmin(req.body);
        res.json(rows);
        //console.log('rows: ', rows);

        let transporter = nodemailer.createTransport({
            host: "smtp-relay.brevo.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: "7a9d83001@smtp-brevo.com", // generated brevo user
                pass: "2bNEKDBCd7JytLIH", // generated brevo password
            },
            tls: {
                rejectUnauthorized: true
            }
        });

        const recepients = ["work@ufstechnologies.com", "cristine@ufstechnologies.com" ]
        
        const msg = {
            from: "info@IGMacademy.in",
            to: recepients,
            subject: 'New Student Enrolled',
            html: `
            
            <br/>Hello, <br/>
            <p>A new student has enrolled. Below are the details:</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Student Name</th>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${rows[0].student_Name_}</td>
            </tr>
            <tr>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Course Name</th>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${rows[0].course_Name_}</td>
            </tr>
      
            </table>
            <br/>`,


        };

        const sendMailPromise = () => {
            return new Promise((resolve, reject) => {
                transporter.sendMail(msg, function (err, info) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(info);
                    }
                });
            });
        };


        // await sendMailPromise();
    }
    catch (e) {
        console.log('e: ', e);
        res.status(500).json({ success: false, message:  e.message, error: e.message });
    }
});
router.get('/Search_student/', async (req, res, next) => {
    try {
        console.log("req.query",req.query);
        
        const rows = await student.Search_student(req.query.student_Name,req.query.page,req.query.pageSize,req.query.courseId,req.query.batchId,req.query.enrollment_status,req.query.activeStatus);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to search student', error: e.message });
    }
});
// Search_student_lead
router.get('/Search_student_lead/', async (req, res, next) => {
    try {
        console.log("req.query",req.query);
        
        const rows = await student.Search_student_lead(req.query.student_Name,req.query.page,req.query.pageSize,req.query.courseId,req.query.batchId,req.query.enrollment_status,req.query.activeStatus,req.query.branchId,req.userId,req.userTypeId);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to search student', error: e.message });
    }
});
router.get('/Get_All_Students/', async (req, res, next) => {
    try {
        const rows = await student.Get_All_Students(req.query.student_Name);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to search student', error: e.message });
    }
});

router.get('/Get_student/:student_Id_?', async (req, res, next) => {
    try {
        const rows = await student.Get_student(req.params.student_Id_, req.query.is_Student);
        console.log('rows: ', rows);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get student', error: e.message });
    }
});

router.get('/Get_Courses_By_StudentId/:student_Id_?', async (req, res, next) => {
    try {
        const rows = await student.Get_Courses_By_StudentId(req.params.student_Id_,req.query.course_Name,req.query.priceFrom ,req.query.priceTo);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get courses', error: e.message });
    }
});

router.get('/GetAllCourses/', async (req, res, next) => {
    try {
        console.log('req.query.course_Type: ', req.query.course_Type);
        console.log('req.userId: ', req.userId);
        const rows = await student.GetAllCourses(req.query.course_Type, req.userId,req.query.priceFrom ,req.query.priceTo);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get courses', error: e.message });
    }
});
// Get_DocumentTypes
router.get('/Get_DocumentTypes/', async (req, res, next) => {
    try {

        const rows = await student.Get_DocumentTypes();
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get courses', error: e.message });
    }
});
router.get('/Search_Occupations/', async (req, res, next) => {
    try {
        const rows = await student.Search_Occupations();
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get courses', error: e.message });
    }
});
router.get('/Branch_Dropdown/', async (req, res, next) => {
    try {
        const rows = await student.Branch_Dropdown(); // should return both result sets
        res.json(rows);
        console.log('rows: ', rows);
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get courses', error: e.message });
    }
});

router.get('/User_Dropdown/', async (req, res, next) => {
    try {
        const rows = await student.User_Dropdown(); // should return both result sets
        res.json(rows);
        //console.log('rows: ', rows);
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get courses', error: e.message });
    }
});


router.get('/Department_Dropdown/', async (req, res, next) => {
    try {
        const rows = await student.Department_Dropdown(); // should return both result sets
        res.json(rows);
        console.log('rows: ', rows);
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get courses', error: e.message });
    }
});
router.get('/loadBatches/', async (req, res, next) => {
    try {
        const rows = await student.course_batch_Dropdown(); // should return both result sets
        res.json(rows);
        console.log('rows: ', rows);
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get courses', error: e.message });
    }
});
router.get('/Course_Dropdown/', async (req, res, next) => {
    try {
        const rows = await student.Course_Dropdown(); // should return both result sets
        res.json(rows);
        console.log('rows: ', rows);
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get courses', error: e.message });
    }
});

router.get('/Get_StudentDocuments/:studentId', async (req, res) => {
  const studentId = parseInt(req.params.studentId, 10);

  try {
     const rows = await student.Get_StudentDocuments(studentId); // should return both result sets
        res.json(rows);
        console.log('rows: ', rows);
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get courses', error: e.message });
    }
});


router.post('/save_DocumentMetadata', async (req, res) => {
  try {

     const rows = await student.save_DocumentMetadata(req.body); // should return both result sets
        res.json(rows);
        console.log('rows: ', rows);

   

    // res.json({ success: true, message: 'Document saved successfully' });
  } catch (err) {
    console.error('Error saving document:', err);
    res.status(500).json({ success: false, message: 'DB Error', error: err.message });
  }
});

router.get('/student/Get_StudentDocuments/:studentId', async (req, res) => {
  const studentId = parseInt(req.params.studentId, 10);

  try {
    const [result] = await db.query('CALL Get_StudentDocuments(?)', [studentId]);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
});



router.post('/Delete_Student_Account/:student_Id?', async (req, res, next) => {
    try {
        const rows = await student.Delete_Student_Account(req.params.student_Id?req.params.student_Id:req.userId);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get courses', error: e.message });
    }
});
// Delete_StudentDocument
router.post('/Delete_StudentDocument/:documentId', async (req, res) => {
  try {
    const documentId = req.params.documentId;
    const rows = await student.Delete_StudentDocument(documentId);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: e.message,
    });
  }
});

router.get('/CheckStudentEnrollment/?:course_Id', async (req, res, next) => {
    try {
        const rows = await student.CheckStudentEnrollment(req.userId,req.params.course_Id);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get courses', error: e.message });
    }
});

router.get('/Get_Courses_By_Category/:category_Id_?', async (req, res, next) => {
    try {
        const rows = await student.Get_Courses_By_Category(req.params.category_Id_);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get courses', error: e.message });
    }
});
router.get('/Get_student_followup_history/:student_Id_?', async (req, res, next) => {
    try {
        const rows = await student.Get_student_followup_history(req.params.student_Id_);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get courses', error: e.message });
    }
});
router.get('/Get_student_current_followup/:student_Id_?', async (req, res, next) => {
    try {
        const rows = await student.Get_student_current_followup(req.params.student_Id_);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get courses', error: e.message });
    }
});
router.get('/GetEnrolledCourses/:student_Id_?', async (req, res, next) => {
    try {
        const rows = await student.GetEnrolledCourses(req.params.student_Id_);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get courses', error: e.message });
    }
});
router.post('/SaveChatMessage/', async (req, res, next) => {
    try {
        const rows = await student.Save_chat_message(req.body);
        res.json(rows);


        
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to save message', error: e.message });
    }
});
router.post('/Save_Occupation/', async (req, res, next) => {
    try {
        console.log('req.body: ', req.body);
        const rows = await student.Save_Occupation(req.body);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to save message', error: e.message });
    }
});
router.post('/Save_Followup_Status/', async (req, res, next) => {
    try {
        const rows = await student.Save_Followup_Status(req.body);
        res.json(rows[0]);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to save follow-up status', error: e.message });
    }
});
router.get('/Get_Followup_Status/', async (req, res, next) => {
    try {
        const rows = await student.Get_Followup_Status();
        res.json(rows[0]);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get follow-up status', error: e.message });
    }
});
router.post('/Delete_Followup_Status/', async (req, res, next) => {
    try {
        const rows = await student.Delete_Followup_Status(req.body.Status_Id);
        res.json(rows[0]);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to delete follow-up status', error: e.message });
    }
});
router.post('/Bulk_Student_Import/', async (req, res, next) => {
    try {
        console.log('req.body: ', req.body.students);
        const rows = await student.Bulk_Student_Import(req.body.students);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to save message', error: e.message });
    }
});
router.post('/BulkImportInstallmentsBatch/', async (req, res, next) => {
    try {
        console.log('req.body: ', req.body.students);
        const rows = await student.BulkImportInstallmentsBatch(req.body.students);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to save message', error: e.message });
    }
});

router.post('/saveAllEnrollments/', async (req, res, next) => {
    try {
        console.log('req.body: ', req.body.students);
        const rows = await student.saveAllEnrollments(req.body.students);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to save message', error: e.message });
    }
});
router.post('/Insert_Student_Exam_Result/', async (req, res, next) => {
    try {
        console.log('req.body: ', req.body);
        const rows = await student.Insert_Student_Exam_Result(req.body);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to insert exam result', error: e.message });
    }
});

router.post('/Update_Student_LastOnline/', async (req, res, next) => {
    try {
        console.log('req.body: ', req.body);
        const rows = await student.Update_Student_LastOnline(req.userId,req.body.Last_Online);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to save message', error: e.message });
    }
});
router.get('/Get_Chat_With_Bot/:student_Id_?', async (req, res, next) => {
    try {
        const rows = await student.Get_Chat_With_Bot(req.params.student_Id_);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get chat history', error: e.message });
    }
});


router.get('/get_student_fees_details/:student_Id_?', async (req, res, next) => {
    try {
        const rows = await student.get_student_fees_details(req.params.student_Id_);
        // console.log('rows: ', rows);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get data', error: e.message });
    }
});

router.get('/delete_Student_Exam_result/:StudentExam_ID?', async (req, res, next) => {
    try {
        const rows = await student.delete_Student_Exam_result(req.params.StudentExam_ID);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get chat history', error: e.message });
    }
});

router.get('/Get_Live_Classes_By_CourseId/:course_Id_?/:Batch_Id_?', async (req, res, next) => {
    try {
        console.log('req.userId: ', req.userId);
        const rows = await student.Get_Live_Classes_By_CourseId(req.params.course_Id_,req.userId,req.params.Batch_Id_);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get live classes', error: e.message });
    }
});
router.get('/Get_Recorded_LiveClasses/:Batch_Id_?', async (req, res, next) => {
    try {
        console.log('req.userId: ', req.userId);
        const rows = await student.Get_Recorded_LiveClasses(req.userId,req.params.Batch_Id_);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get live classes', error: e.message });
    }
});
router.get('/Get_Student_Exam_Results', async (req, res) => {
    const { studentId, courseId } = req.query; // Assuming you're passing the IDs as query parameters
    try {
        const results = await student.Get_Student_Exam_Results(studentId,courseId);

        res.json(results);
    } catch (error) {
        console.error('Error fetching exam results:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch exam results', error: error.message });
    }
});

router.get('/Get_Available_Mentors/', async (req, res, next) => {
    try {
        const rows = await student.Get_Available_Mentors(req.userId);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get Get_Available_Mentors', error: e.message });
    }
});
router.get('/Get_Available_Hod/', async (req, res, next) => {
    try {
        const rows = await student.Get_Available_Hod(req.userId);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get Get_Available_Hod', error: e.message });
    }
});
router.get('/Generate_certificate/:StudentCourse_ID/:value', async (req, res, next) => {
    try {
        const rows = await student.Generate_certificate(req.params.StudentCourse_ID,req.params.value);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get Generate certificate', error: e.message });
    }
});

router.get('/Get_Dashboard_Data/', async (req, res, next) => {
    try {
        const rows = await student.Get_Dashboard_Data_By_StudentId(req.userId);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get dashboard data', error: e.message });
    }
});

router.get('/Get_ExamDetails_By_StudentId/', async (req, res, next) => {
    try {
        const rows = await student.Get_ExamDetails_By_StudentId(req.query.student_Id, req.query.exam_Id);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get exam data', error: e.message });
    }
});

router.post('/Save_AppInfo/', async (req, res, next) => {
    try {
        const appInfo = {
            user_id: req.userId,
            isStudent: req.isStudent,
            ...req.body
        };
        const rows = await student.Save_AppInfo(appInfo);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to save app info', error: e.message });
    }
});

router.get('/Get_AppInfo_List/', async (req, res, next) => {
    try {
        const filters = {
            isStudent: req.query.isStudent,
            appVersion: req.query.appVersion || '',
            nameSearch: req.query.nameSearch || '', 
            fromDate: req.query.fromDate || null,
            toDate: req.query.toDate || null,
            isBatteryOptimized: req.query.isBatteryOptimized || -1, // New battery optimization filter
            page: parseInt(req.query.page) || 1,
            pageSize: parseInt(req.query.pageSize) || 10
        };
        const rows = await student.Get_AppInfo_List(filters);
        res.json(rows);
    }
    catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get app info list', error: e.message });
    }
});
router.get('/Followup_status_Dropdown/', async (req, res, next) => {
    try {
        const rows = await student.Followup_status_Dropdown(); // should return both result sets
        res.json(rows);
        //console.log('rows: ', rows);
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get courses', error: e.message });
    }
});

router.get('/Get_Enquiry_Summary/', async (req, res, next) => {
    try {
        const { fromDate, toDate } = req.query;
        const rows = await student.Get_Enquiry_Summary(fromDate, toDate);
        res.json(rows);
    } catch (e) {
        res.status(500).json({ success: false, message: 'Failed to get enquiry summary', error: e.message });
    }
});

module.exports = router;