const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
    multipleStatements: true,
};

async function createProcs() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to database.");

        const procs = [
            `DROP PROCEDURE IF EXISTS Save_Email_Template;`,
            `CREATE PROCEDURE Save_Email_Template(
                IN p_Template_ID INT,
                IN p_Template_Name VARCHAR(255),
                IN p_Subject VARCHAR(255),
                IN p_Body TEXT
            )
            BEGIN
                IF p_Template_ID = 0 OR p_Template_ID IS NULL THEN
                    INSERT INTO email_templates (Template_Name, Subject, Body)
                    VALUES (p_Template_Name, p_Subject, p_Body);
                    SELECT LAST_INSERT_ID() AS InsertId;
                ELSE
                    UPDATE email_templates
                    SET Template_Name = p_Template_Name,
                        Subject = p_Subject,
                        Body = p_Body,
                        Updated_At = CURRENT_TIMESTAMP
                    WHERE Template_ID = p_Template_ID;
                    SELECT p_Template_ID AS InsertId;
                END IF;
            END;`,

            `DROP PROCEDURE IF EXISTS Get_Email_Template;`,
            `CREATE PROCEDURE Get_Email_Template(
                IN p_Template_ID INT
            )
            BEGIN
                SELECT * FROM email_templates WHERE Template_ID = p_Template_ID AND Delete_Status = 0;
            END;`,

            `DROP PROCEDURE IF EXISTS Search_Email_Template;`,
            `CREATE PROCEDURE Search_Email_Template(
                IN p_Search_Term VARCHAR(100)
            )
            BEGIN
                SET p_Search_Term = CONCAT('%', IFNULL(p_Search_Term, ''), '%');
                SELECT * FROM email_templates 
                WHERE Template_Name LIKE p_Search_Term 
                AND Delete_Status = 0;
            END;`,

            `DROP PROCEDURE IF EXISTS Delete_Email_Template;`,
            `CREATE PROCEDURE Delete_Email_Template(
                IN p_Template_ID INT
            )
            BEGIN
                UPDATE email_templates SET Delete_Status = 1 WHERE Template_ID = p_Template_ID;
            END;`
        ];

        for (const proc of procs) {
            await connection.query(proc);
            console.log("Executed procedure update.");
        }

        await connection.end();
        console.log("Procedures created successfully.");
    } catch (e) {
        console.error("Error creating procedures:", e);
        if (connection) await connection.end();
    }
}

createProcs();
