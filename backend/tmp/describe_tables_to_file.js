const mysql = require('mysql2/promise');
const fs = require('fs');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_new",
    multipleStatements: true,
};

async function describeTables() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [courseCols] = await connection.query("DESCRIBE course");
        const [scCols] = await connection.query("DESCRIBE student_course");
        
        const output = `Course Table Columns:\n${courseCols.map(c => c.Field).join('\n')}\n\nStudent_Course Table Columns:\n${scCols.map(c => c.Field).join('\n')}`;
        fs.writeFileSync('tmp/tables_description.txt', output);
        console.log("Written to tmp/tables_description.txt");
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

describeTables();
