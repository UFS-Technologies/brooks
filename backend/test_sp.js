const db = require('./config/dbconnection');

const messageId = '<202604281004.79211113489@smtp-relay.mailin.fr>'; // From the check_logs.js output

db.query('CALL Update_Email_Opened(?)', [messageId], (err, result) => {
    if (err) {
        console.error('Error updating status:', err);
    } else {
        console.log('Update result:', result);
        db.query('SELECT Status, Opened_At FROM Email_Logs WHERE Message_ID = ?', [messageId], (err, rows) => {
            console.log('Current row state:', rows);
            db.end();
        });
    }
});
