const mysql = require('mysql2/promise');
const dbConfig = { host: "localhost", user: "root", password: "password", database: "brooks_new", multipleStatements: true };
async function describeTables() {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        const [student] = await conn.query("DESCRIBE student");
        const [course] = await conn.query("DESCRIBE course");
        console.log("student:", student.map(c => c.Field).join(", "));
        console.log("course:", course.map(c => c.Field).join(", "));
        
        // try looking for lead or enquiry word in tables
        const [tables] = await conn.query("SHOW TABLES LIKE '%lead%'");
        console.log("tables like lead:", tables);
        
        const [tables2] = await conn.query("SHOW TABLES LIKE '%enquiry%'");
        console.log("tables like enquiry:", tables2);
    } catch(e) { console.error(e); }
    if(conn) await conn.end();
}
describeTables();
