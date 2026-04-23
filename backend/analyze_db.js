
const db = require("./config/dbconnection");

async function listTables() {
    try {
        const [rows] = await db.promise().query("SHOW TABLES");
        console.log("Tables in database:", rows.map(r => Object.values(r)[0]));
        process.exit(0);
    } catch (err) {
        console.error("Error listing tables:", err);
        process.exit(1);
    }
}

listTables();
