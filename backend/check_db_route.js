const db = require('./config/dbconnection');

db.query("SELECT * FROM menu WHERE Menu_Name = 'Mail Report'", (err, results) => {
    if (err) console.error(err);
    else console.log(results);
    db.end();
});
