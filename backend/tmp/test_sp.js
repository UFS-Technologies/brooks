const db = require('./config/dbconnection');

db.query('CALL Search_student_lead("", 1, 10, NULL, NULL, "all", "all", 131, 2)', (err, rows) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(rows[1] ? rows[1].length : 0);
    process.exit(0);
});
