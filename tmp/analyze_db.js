const mysql = require('mysql2');
const config = {
    host: "DESKTOP-IK6ME8M",
    user: 'root',
    password: 'root',
    database: "brooks",
    multipleStatements: true
};

function analyze() {
    const connection = mysql.createConnection(config);
    
    connection.connect(err => {
        if (err) {
            console.error("Connection error:", err.message);
            return;
        }
        console.log("Connected to DB");

        connection.query("SHOW TABLES", (err, tables) => {
            if (err) {
                console.error("Query error (SHOW TABLES):", err.message);
                connection.end();
                return;
            }
            console.log("Tables in database:", JSON.stringify(tables));

            const followupStatusTable = tables.find(t => {
                const name = Object.values(t)[0].toLowerCase();
                return name.includes('followup_status') || name.includes('follow_up_status');
            });

            if (followupStatusTable) {
                const tableName = Object.values(followupStatusTable)[0];
                console.log(`Analyzing table: ${tableName}`);
                connection.query(`DESCRIBE ${tableName}`, (err, columns) => {
                    console.log("Columns:", JSON.stringify(columns));
                    connection.query(`SELECT * FROM ${tableName} LIMIT 5`, (err, data) => {
                        console.log("Sample Data:", JSON.stringify(data));
                        connection.end();
                    });
                });
            } else {
                console.log("No explicit followup_status table found. Checking stored procedures...");
                connection.query("SHOW PROCEDURE STATUS WHERE Db = 'brooks'", (err, procedures) => {
                    console.log("Procedures:", JSON.stringify(procedures.map(p => p.Name)));
                    
                    const dropdownProc = procedures.find(p => p.Name.toLowerCase().includes('followup_status_dropdown'));
                    if (dropdownProc) {
                        console.log(`Found procedure: ${dropdownProc.Name}`);
                        connection.query(`SHOW CREATE PROCEDURE ${dropdownProc.Name}`, (err, procDefine) => {
                            console.log("Procedure Definition:", procDefine[0]['Create Procedure']);
                            connection.end();
                        });
                    } else {
                        connection.end();
                    }
                });
            }
        });
    });
}

analyze();
