
const db = require("./config/dbconnection");

async function search() {
    try {
        const [tables] = await db.promise().query("SHOW TABLES");
        for (let t of tables) {
            const tableName = Object.values(t)[0];
            try {
                // This is a naive check for 200 in any column
                const [rows] = await db.promise().query(`SELECT * FROM ${tableName}`);
                for (let row of rows) {
                    if (Object.values(row).includes(200) || Object.values(row).includes("200") || Object.values(row).includes(200.00)) {
                        console.log(`Found 200 in table: ${tableName}`);
                        console.log(row);
                        break; 
                    }
                }
            } catch (e) {
                // Skip tables that can't be read easily
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

search();
