const db = require('./config/dbconnection');

async function checkTable() {
    db.query('SELECT * FROM email_logs ORDER BY Sent_At DESC LIMIT 10', (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            console.log(JSON.stringify(rows, null, 2));
        }
        process.exit(0);
    });
}

checkTable();
