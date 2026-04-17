const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
    multipleStatements: true,
};

async function checkProcs() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query(`
            SELECT ROUTINE_NAME 
            FROM information_schema.ROUTINES 
            WHERE ROUTINE_TYPE = 'PROCEDURE' 
              AND ROUTINE_SCHEMA = 'brooks_db'
              AND ROUTINE_NAME IN ('Save_Enquiry_Source', 'Get_All_Enquiry', 'Delete_Enquiry_Source')
        `);
        console.log("Found Procedures:", rows.map(r => r.ROUTINE_NAME));
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

checkProcs();
