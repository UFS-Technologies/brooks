const db = require('../backend/config/dbconnection');

async function checkLogs() {
    try {
        const [rows] = await db.promise().query("SELECT Message_ID, Status, Opened_At FROM Email_Logs ORDER BY Sent_At DESC LIMIT 10");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkLogs();
