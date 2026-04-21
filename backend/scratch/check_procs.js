const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
    // multipleStatements: true
};

async function getProcBody(procName) {
    let connection;
    try {
        console.log(`Connecting to DB to fetch ${procName}...`);
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query(`
            SHOW CREATE PROCEDURE ${procName}
        `);
        if (rows.length > 0) {
            console.log(`--- PROCEDURE ${procName} ---`);
            console.log(rows[0]['Create Procedure']);
        } else {
            console.log(`Procedure ${procName} not found.`);
        }
    } catch (e) {
        console.error(`Error fetching ${procName}:`, e.message);
    } finally {
        if (connection) await connection.end();
    }
}

async function run() {
    await getProcBody('get_course_names');
    await getProcBody('get_course_Batches');
    await getProcBody('Get_Report_Student');
}

run();
