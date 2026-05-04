const emailLog = require('./models/email_log');
const db = require('./config/dbconnection');

async function checkLogs() {
    try {
        const logs = await emailLog.Get_Mail_Report(null, null, null);
        console.log('Last 10 Email Logs:');
        console.log(JSON.stringify(logs.slice(0, 10), null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error fetching logs:', error);
        process.exit(1);
    }
}

checkLogs();
