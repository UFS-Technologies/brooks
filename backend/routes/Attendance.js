const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { sendWhatsAppMessage } = require('../helpers/whatsapp-helper');
const studentModel = require('../models/student');

router.post('/Save_Attendance', async (req, res) => {
    try {
        const { attendanceData, markedBy } = req.body;

        if (!attendanceData || !Array.isArray(attendanceData)) {
            return res.status(400).json({ success: false, message: 'Invalid attendance data.' });
        }

        // 1. Save to Database
        await Attendance.Save_Attendance(attendanceData, markedBy || req.userId);

        // 2. Filter Absent Students and Send WhatsApp
        const absentStudents = attendanceData.filter(a => a.Status === 0);
        
        for (const record of absentStudents) {
            try {
                // Fetch student details to get name and parent contact
                const studentDetails = await studentModel.Get_student(record.Student_ID, 1);
                if (studentDetails && studentDetails[0] && studentDetails[0][0]) {
                    const student = studentDetails[0][0];
                    const parentPhone = student.Guardian_Phone || student.Phone_Number;
                    const studentName = `${student.First_Name} ${student.Last_Name}`;
                    const dateStr = record.Attendance_Date;
                    
                    // Trigger WhatsApp Notification
                    // Note: We use a try-catch inside the loop so one failure doesn't stop others
                    await sendWhatsAppMessage(
                        parentPhone, 
                        studentName, 
                        dateStr, 
                        record.Course_Name || 'Course', 
                        record.Batch_Name || 'Batch'
                    );
                }
            } catch (waError) {
                console.error(`Failed to send WhatsApp for student ${record.Student_ID}:`, waError.message);
            }
        }

        res.json({ success: true, message: 'Attendance saved and notifications sent.' });
    } catch (error) {
        console.error('Save_Attendance Error:', error);
        res.status(500).json({ success: false, message: 'Failed to save attendance', error: error.message });
    }
});

router.get('/Get_Attendance_History', async (req, res) => {
    try {
        const { courseId, batchId, fromDate, toDate } = req.query;
        const rows = await Attendance.Get_Attendance_History(
            parseInt(courseId) || 0,
            parseInt(batchId) || 0,
            fromDate,
            toDate,
            req.userId
        );
        res.json({ success: true, data: Array.isArray(rows) ? rows : [] });
    } catch (error) {
        console.error('Get_Attendance_History Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch attendance history', error: error.message });
    }
});

module.exports = router;
