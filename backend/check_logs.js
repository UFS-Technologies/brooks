const db = require('./config/dbconnection');

db.query('SELECT Log_ID, Sent_At, Email_Address, Message_ID, Status FROM Email_Logs ORDER BY Sent_At DESC LIMIT 5', (err, rows) => {
    if (err) {
        console.error('Error fetching logs:', err);
    } else {
        console.log('Latest 5 Email Logs:');
        console.table(rows);
    }
    db.end();
});
