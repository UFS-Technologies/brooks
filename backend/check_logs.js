const db = require('./config/dbconnection');

db.query('SELECT Message_ID, Status, Opened_At FROM Email_Logs ORDER BY Log_ID DESC LIMIT 10', (err, results) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
});
