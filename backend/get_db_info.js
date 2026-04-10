const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
    multipleStatements: true,
};

async function getDBInfo() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [usersDesc] = await connection.query('DESCRIBE users');
        const [spCreate] = await connection.query("SHOW CREATE PROCEDURE Save_User");
        
        const fs = require('fs');
        fs.writeFileSync('db_info.json', JSON.stringify({
            users: usersDesc,
            sp: spCreate[0]['Create Procedure']
        }, null, 2));
        
        console.log("DB info extracted successfully to db_info.json!");
        await connection.end();
    } catch (e) {
        console.error(e);
    }
}

getDBInfo();
