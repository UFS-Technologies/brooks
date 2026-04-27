const mysql = require('mysql2/promise');
const dbConfigs = [
    { name: 'brooks_db', host: 'localhost', user: 'root', password: 'password', database: 'brooks_db' },
    { name: 'brooks_new', host: 'localhost', user: 'root', password: 'password', database: 'brooks_new' }
];

async function compareDbs() {
    for (const config of dbConfigs) {
        let connection;
        try {
            connection = await mysql.createConnection(config);
            const [rows] = await connection.query("SELECT COUNT(*) as count FROM menu");
            console.log(`Database ${config.name} has ${rows[0].count} menus.`);
            await connection.end();
        } catch (e) {
            console.log(`Database ${config.name} connection failed or table missing: ${e.message}`);
            if (connection) await connection.end();
        }
    }
}

compareDbs();
