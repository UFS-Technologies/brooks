const db = require('./config/dbconnection');
db.query("UPDATE menu SET Route = '/admin/Mail_Report' WHERE Menu_Name = 'Mail Report'", (err, rows) => {
    if (err) console.error(err);
    else console.log("Updated database route to /admin/Mail_Report");
    db.end();
});
