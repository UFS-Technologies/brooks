
const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_new",
};

async function checkDuplicates() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to database.");

        const [duplicates] = await connection.query(`
            SELECT Email, Password, COUNT(*) as count 
            FROM users 
            WHERE Delete_Status = 0 
            GROUP BY Email, Password 
            HAVING count > 1
        `);

        if (duplicates.length > 0) {
            console.log("Found duplicate email/password combinations:");
            duplicates.forEach(row => {
                console.log(`Email: ${row.Email}, Count: ${row.count}`);
            });
        } else {
            console.log("No duplicates found for active users.");
        }

        await connection.end();
    } catch (e) {
        console.error("Error checking duplicates:", e.message);
        if (connection) await connection.end();
    }
}

checkDuplicates();
