const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
    multipleStatements: true,
};

async function syncToBrooksDb() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to brooks_db.");

        // 1. Create table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS email_templates (
                Template_ID INT AUTO_INCREMENT PRIMARY KEY,
                Template_Name VARCHAR(255) NOT NULL,
                Subject VARCHAR(255) NOT NULL,
                Body TEXT NOT NULL,
                Delete_Status TINYINT(1) DEFAULT 0,
                Created_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                Updated_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // 2. Create Stored Procedures
        const procedures = [
            `DROP PROCEDURE IF EXISTS Save_Email_Template;
            CREATE PROCEDURE Save_Email_Template(
                IN p_Template_ID INT,
                IN p_Template_Name VARCHAR(255),
                IN p_Subject VARCHAR(255),
                IN p_Body TEXT
            )
            BEGIN
                IF p_Template_ID = 0 THEN
                    INSERT INTO email_templates (Template_Name, Subject, Body)
                    VALUES (p_Template_Name, p_Subject, p_Body);
                    SELECT LAST_INSERT_ID() AS Template_ID;
                ELSE
                    UPDATE email_templates
                    SET Template_Name = p_Template_Name,
                        Subject = p_Subject,
                        Body = p_Body
                    WHERE Template_ID = p_Template_ID;
                    SELECT p_Template_ID AS Template_ID;
                END IF;
            END;`,

            `DROP PROCEDURE IF EXISTS Get_Email_Template;
            CREATE PROCEDURE Get_Email_Template(IN p_Template_ID INT)
            BEGIN
                SELECT * FROM email_templates WHERE Template_ID = p_Template_ID AND Delete_Status = 0;
            END;`,

            `DROP PROCEDURE IF EXISTS Search_Email_Template;
            CREATE PROCEDURE Search_Email_Template(IN p_Search_Term VARCHAR(255))
            BEGIN
                SELECT * FROM email_templates 
                WHERE (p_Search_Term = '' OR Template_Name LIKE CONCAT('%', p_Search_Term, '%') OR Subject LIKE CONCAT('%', p_Search_Term, '%'))
                AND Delete_Status = 0
                ORDER BY Template_ID DESC;
            END;`,

            `DROP PROCEDURE IF EXISTS Delete_Email_Template;
            CREATE PROCEDURE Delete_Email_Template(IN p_Template_ID INT)
            BEGIN
                UPDATE email_templates SET Delete_Status = 1 WHERE Template_ID = p_Template_ID;
            END;`
        ];

        for (const proc of procedures) {
            await connection.query(proc);
        }

        // 3. Add Menu
        const [menuRows] = await connection.query("SELECT Menu_ID FROM menu WHERE Route = '/admin/email-templates'");
        let emailMenuId;
        if (menuRows.length === 0) {
            const [result] = await connection.query(`
                INSERT INTO menu (Menu_Name, Route, Parent_Menu_ID, Delete_Status)
                VALUES ('Email', '/admin/email-templates', NULL, 0)
            `);
            emailMenuId = result.insertId;
            console.log("Added Email menu with ID:", emailMenuId);
        } else {
            emailMenuId = menuRows[0].Menu_ID;
            console.log("Email menu already exists with ID:", emailMenuId);
        }

        // 4. Permissions for ALL users in brooks_db
        const [allUsers] = await connection.query("SELECT User_ID FROM users");
        for (const user of allUsers) {
            await connection.query(`
                INSERT INTO user_menu_selection (Menu_Id, User_Id, IsEdit, IsSave, IsDelete, IsView, DeleteStatus)
                SELECT ?, ?, 1, 1, 1, 1, 0
                FROM DUAL
                WHERE NOT EXISTS (SELECT 1 FROM user_menu_selection WHERE Menu_Id = ? AND User_Id = ?);
            `, [emailMenuId, user.User_ID, emailMenuId, user.User_ID]);
            
            await connection.query(`
                UPDATE user_menu_selection SET IsView = 1, DeleteStatus = 0 WHERE Menu_Id = ? AND User_Id = ?
            `, [emailMenuId, user.User_ID]);
        }
        console.log("Permissions granted to all users in brooks_db.");

        await connection.end();
        console.log("Sync to brooks_db completed.");
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

syncToBrooksDb();
