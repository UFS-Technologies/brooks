const db = require('./config/dbconnection');
db.query("SHOW CREATE PROCEDURE Search_student", (err, res) => {
    if (err) console.error(err);
    else console.log(res[0]['Create Procedure']);
    process.exit(0);
});
