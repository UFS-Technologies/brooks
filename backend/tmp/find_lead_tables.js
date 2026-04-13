const mysql = require('mysql2/promise');
const dbConfig = { host: "localhost", user: "root", password: "password", database: "brooks_new", multipleStatements: true };
async function describeTables() {
    let conn;
    try {
        conn = await mysql.createConnection(dbConfig);
        const [userStatus] = await conn.query("SELECT * FROM user_status");
        console.log("user_status:", userStatus);
        
        const [followupStatus] = await conn.query("SELECT * FROM followup_status");
        console.log("followup_status:", followupStatus);
        
        const [studentCourse] = await conn.query("DESCRIBE student_course");
        console.log("student_course:", studentCourse.map(c => c.Field).join(", "));
        
        // Let's count some students
        const [sCount] = await conn.query("SELECT COUNT(*) as c, Is_Registered, isActive, Status_Name FROM student GROUP BY Is_Registered, isActive, Status_Name");
        console.log("Student aggregate:", sCount);

    } catch(e) { console.error(e); }
    if(conn) await conn.end();
}
describeTables();
