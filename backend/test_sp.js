const db = require('./config/dbconnection');

db.query('CALL Search_student_lead("", 1, 10, NULL, NULL, "all", "all", 131, 1)', (err, rows) => {
    if (err) {
        console.error("SQL Error:", err.message);
        process.exit(1);
    }
    console.log("Success! Rows:", rows[1] ? rows[1].length : 0);
    process.exit(0);
});
