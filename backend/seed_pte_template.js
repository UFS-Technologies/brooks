const mysql = require('mysql2/promise');

const databases = ['brooks_new', 'brooks_db', 'avies_db'];
const dbConfigBase = {
    host: "localhost",
    user: "root",
    password: "password",
};

const template = {
    name: 'PTE course admission confirmation',
    subject: 'PTE Training Program - Admission Confirmation',
    body: `Dear [Student Name],

I hope this email finds you well.

We are pleased to confirm that we have successfully received your payment of [Payment Amount] for the PTE Training Program. Thank you for completing the payment process. Please find the payment receipt attached for your reference.

We are excited to inform you that your classes will commence on [Start Date] at [Start Time]. The sessions will be conducted via Zoom, and the meeting link will be shared with you later today, prior to the start of the class.

Below are the key details of your course:

📘 1. Course Duration & Class Timing
• Duration: 1 month
• Total sessions: 20 classes + 5 mock tests
• Class days: Monday to Friday
• Class duration: 1 hour 15 minutes per session
• Mock tests: Every Saturday

💬 2. WhatsApp Group
• A WhatsApp group will be created for important updates, class notes, test links, and announcements.
• You may post questions and share your answers in the group.
• The group will remain active until your exam date, providing continuous access to the trainer.

🔁 3. Missed Classes
• If you miss a class, you will be given access to the class recording.
• Kindly inform us in advance via the WhatsApp group if you are unable to attend.

📅 4. Class Cancellations
• In the event of any cancellation, the session will be rescheduled to a mutually suitable day.

📚 5. Materials & Resources
• Additional study materials and resources will be shared throughout the course.

📞 6. Ongoing Support
• You may contact the trainer anytime via the WhatsApp group for assistance or clarification until your exam date.

If you have any questions or require further assistance, please feel free to reach out. We look forward to supporting you throughout your PTE preparation and helping you achieve your best possible score.`
};

async function seedPTETemplate() {
    for (const dbName of databases) {
        let connection;
        try {
            connection = await mysql.createConnection({ ...dbConfigBase, database: dbName });
            console.log(`Connected to database: ${dbName}`);

            // Ensure table exists
            await connection.query(`
                CREATE TABLE IF NOT EXISTS email_templates (
                    Template_ID INT AUTO_INCREMENT PRIMARY KEY,
                    Template_Name VARCHAR(255) NOT NULL,
                    Subject VARCHAR(255) NOT NULL,
                    Body TEXT NOT NULL,
                    Delete_Status TINYINT(1) DEFAULT 0,
                    Created_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    Updated_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);

            // Check if already exists
            const [existing] = await connection.query("SELECT * FROM email_templates WHERE Template_Name = ?", [template.name]);
            
            if (existing.length === 0) {
                await connection.query(
                    "INSERT INTO email_templates (Template_Name, Subject, Body) VALUES (?, ?, ?)",
                    [template.name, template.subject, template.body]
                );
                console.log(`Inserted template: ${template.name} into ${dbName}`);
            } else {
                await connection.query(
                    "UPDATE email_templates SET Subject = ?, Body = ? WHERE Template_Name = ?",
                    [template.subject, template.body, template.name]
                );
                console.log(`Updated template: ${template.name} in ${dbName}`);
            }
            await connection.end();
        } catch (e) {
            console.error(`Error seeding ${dbName}:`, e.message);
            if (connection) await connection.end();
        }
    }
}

seedPTETemplate();
