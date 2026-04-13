const mysql = require('mysql2/promise');
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
        console.log("Course Table Columns:", courseCols.map(c => c.Field).join(', '));
        const [scCols] = await connection.query("DESCRIBE student_course");
        console.log("Student_Course Table Columns:", scCols.map(c => c.Field).join(', '));
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

describeTables();
