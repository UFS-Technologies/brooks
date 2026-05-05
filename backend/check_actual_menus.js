const db = require('./config/dbconnection');

async function check() {
    try {
        db.query("SELECT * FROM menu", (err, results) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            console.log(JSON.stringify(results, null, 2));
            process.exit(0);
        });
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
