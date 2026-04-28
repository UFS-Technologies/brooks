const db = require('./config/dbconnection');

db.query("SELECT * FROM menu LIMIT 20", (err, results) => {
    if (err) console.error(err);
    else console.table(results);
    db.end();
});
