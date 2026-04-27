const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_new",
};

async function checkLeads() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to database.");

        const [leadsWithEmail] = await connection.query("SELECT Student_ID, First_Name, Email, Phone_Number FROM student WHERE Email != '' AND Email IS NOT NULL LIMIT 20");
        console.log("Leads with Email:", leadsWithEmail);

        const [tkasku] = await connection.query("SELECT Student_ID, First_Name, Email FROM student WHERE Email LIKE '%tkasku%'");
        console.log("Leads matching 'tkasku':", tkasku);

        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

checkLeads();
