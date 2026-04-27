const mysql = require('mysql2/promise');

const databases = ['brooks_new', 'brooks_db'];
const dbConfigBase = {
    host: "localhost",
    user: "root",
    password: "password",
};

const templates = [
    {
        name: 'Lead Welcome Greeting',
        subject: 'Welcome to IGM Academy!',
        body: 'Dear Lead,\n\nThank you for your interest in IGM Academy! We are excited to help you on your educational journey. Our counselor will contact you shortly with more details about our courses.\n\nBest regards,\nTeam IGM Academy'
    },
    {
        name: 'Lead Follow-up Reminder',
        subject: 'Following up on your inquiry',
        body: 'Dear Lead,\n\nWe noticed you had an inquiry regarding our courses recently. Do you have any further questions? We are here to help you make the best choice for your future.\n\nBest regards,\nTeam IGM Academy'
    },
    {
        name: 'Course Admission Confirmation',
        subject: 'Admission Confirmed - IGM Academy',
        body: 'Dear Student,\n\nCongratulations! Your admission has been confirmed at IGM Academy. We are thrilled to have you as part of our community. Please check your student portal for your batch details and schedule.\n\nBest regards,\nIGM Academy'
    },
    {
        name: 'Fee Payment Reminder',
        subject: 'Fee Payment Due Reminder',
        body: 'Dear Student,\n\nThis is a gentle reminder that your next fee installment is due soon. Kindly ensure timely payment to avoid any inconvenience. You can pay via the mobile app or visit the branch.\n\nBest regards,\nAccounts Dept, IGM Academy'
    },
    {
        name: 'Payment Receipt Acknowledgment',
        subject: 'Payment Received - Thank You',
        body: 'Dear Student,\n\nWe have successfully received your fee payment. Thank you! Your account has been updated, and you can view the receipt in your student portal.\n\nBest regards,\nAccounts Dept, IGM Academy'
    },
    {
        name: 'Outstanding Balance Alert',
        subject: 'IMPORTANT: Outstanding Fees Notice',
        body: 'Dear Student,\n\nOur records show an outstanding balance on your account. Please clear your dues as soon as possible to ensure uninterrupted access to classes and resources.\n\nBest regards,\nAccounts Dept, IGM Academy'
    },
    {
        name: 'Course Completion Greeting',
        subject: 'Congratulations on Completing Your Course!',
        body: 'Dear Student,\n\nIt is with great pleasure that we congratulate you on finishing your course! We are proud of your achievement and wish you the very best in your future endeavors.\n\nBest regards,\nDirector, IGM Academy'
    }
];

async function seedTemplates() {
    for (const dbName of databases) {
        let connection;
        try {
            connection = await mysql.createConnection({ ...dbConfigBase, database: dbName });
            console.log(`Connected to database: ${dbName}`);

            for (const template of templates) {
                // Check if already exists
                const [existing] = await connection.query("SELECT * FROM email_templates WHERE Template_Name = ?", [template.name]);
                
                if (existing.length === 0) {
                    await connection.query(
                        "INSERT INTO email_templates (Template_Name, Subject, Body) VALUES (?, ?, ?)",
                        [template.name, template.subject, template.body]
                    );
                    console.log(`Inserted template: ${template.name} into ${dbName}`);
                } else {
                    console.log(`Template: ${template.name} already exists in ${dbName}`);
                }
            }
            await connection.end();
        } catch (e) {
            console.error(`Error seeding ${dbName}:`, e.message);
            if (connection) await connection.end();
        }
    }
}

seedTemplates();
