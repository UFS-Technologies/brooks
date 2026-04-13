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
        const [tables] = await connection.query("SHOW TABLES");
        const allTables = tables.map(t => Object.values(t)[0]);
        console.log("--- ALL TABLES (ENQ/LEAD) ---");
        allTables.forEach(t => {
            if (t.toLowerCase().includes('enq') || t.toLowerCase().includes('lead')) {
                console.log(t);
            }
        });
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

findTables();
