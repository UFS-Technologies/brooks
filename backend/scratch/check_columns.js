const db = require("../config/dbconnection");

async function check() {
    try {
        const [rows] = await db.promise().query("DESCRIBE student");
        console.log("Student columns:", rows.map(r => r.Field));
    } catch (e) {
        console.error(e);
    }
    process.exit();
}

check();
