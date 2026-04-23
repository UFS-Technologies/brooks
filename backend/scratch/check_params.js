const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
};

async function getProcParams() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query(`
            SELECT PARAMETER_NAME, DATA_TYPE, PARAMETER_MODE
            FROM information_schema.PARAMETERS 
            WHERE SPECIFIC_SCHEMA = 'brooks_db'
              AND SPECIFIC_NAME = 'Get_user_Menus'
            ORDER BY ORDINAL_POSITION
        `);
        console.log("Parameters for Get_user_Menus:");
        console.log(JSON.stringify(rows, null, 2));
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

getProcParams();
