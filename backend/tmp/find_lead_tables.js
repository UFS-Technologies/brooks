const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_new",
};

async function findTables() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [enquiryRows] = await connection.query("SHOW TABLES LIKE '%enq%'");
        console.log('Enquiry Tables:', enquiryRows.map(r => Object.values(r)[0]));
        const [leadRows] = await connection.query("SHOW TABLES LIKE '%lead%'");
        console.log('Lead Tables:', leadRows.map(r => Object.values(r)[0]));
        const [studentRows] = await connection.query("SHOW TABLES LIKE '%student%'");
        console.log('Student Tables:', studentRows.map(r => Object.values(r)[0]));
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

findTables();
