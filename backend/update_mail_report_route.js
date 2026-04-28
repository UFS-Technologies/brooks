const db = require('./config/dbconnection');
db.query("UPDATE menu SET Route = '/admin/mail-report' WHERE Menu_Name = 'Mail Report'", (err, rows) => {
    if (err) console.error(err);
    else console.log("Updated database route to /admin/mail-report");
    db.end();
});
