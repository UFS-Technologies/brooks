const mysql = require('mysql2/promise');
const fs = require('fs');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_new",
};

async function describeStudent() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query("DESCRIBE student");
        fs.writeFileSync('tmp/student_schema.txt', rows.map(r => `${r.Field} (${r.Type})`).join('\n'));
        console.log("Written to tmp/student_schema.txt");
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

describeStudent();
