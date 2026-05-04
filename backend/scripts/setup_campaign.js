const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "avies_db",
    multipleStatements: true,
};

async function setupCampaign() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to DB.");

        // 1. Create campaign table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS campaign (
                Campaign_ID INT AUTO_INCREMENT PRIMARY KEY,
                Campaign_Name VARCHAR(255) NOT NULL,
                Campaign_Number VARCHAR(100) NOT NULL,
                User_ID INT,
                Delete_Status TINYINT DEFAULT 0,
                Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (User_ID) REFERENCES users(User_ID)
            );
        `);
        console.log("Campaign table created/verified.");

        // 2. Create Save_Campaign procedure
        await connection.query(`DROP PROCEDURE IF EXISTS Save_Campaign;`);
        await connection.query(`
            CREATE PROCEDURE Save_Campaign(
                IN Campaign_ID_ INT,
                IN Campaign_Name_ VARCHAR(255),
                IN Campaign_Number_ VARCHAR(100),
                IN User_ID_ INT
            )
            BEGIN
                IF Campaign_ID_ > 0 THEN
                    UPDATE campaign
                    SET Campaign_Name = Campaign_Name_, Campaign_Number = Campaign_Number_, User_ID = User_ID_
                    WHERE Campaign_ID = Campaign_ID_;
                    SELECT Campaign_ID_ AS Campaign_ID;
                ELSE
                    INSERT INTO campaign (Campaign_Name, Campaign_Number, User_ID)
                    VALUES (Campaign_Name_, Campaign_Number_, User_ID_);
                    SELECT LAST_INSERT_ID() AS Campaign_ID;
                END IF;
            END;
        `);
        console.log("Created Save_Campaign.");

        // 3. Create Search_Campaign procedure
        await connection.query(`DROP PROCEDURE IF EXISTS Search_Campaign;`);
        await connection.query(`
            CREATE PROCEDURE Search_Campaign(IN Campaign_Name_ VARCHAR(255))
            BEGIN
                SELECT c.*, u.First_Name, u.Last_Name 
                FROM campaign c
                LEFT JOIN users u ON c.User_ID = u.User_ID
                WHERE (Campaign_Name_ = '' OR c.Campaign_Name LIKE CONCAT('%', Campaign_Name_, '%'))
                AND c.Delete_Status = 0
                ORDER BY c.Created_At DESC;
            END;
        `);
        console.log("Created Search_Campaign.");

        // 4. Create Delete_Campaign procedure
        await connection.query(`DROP PROCEDURE IF EXISTS Delete_Campaign;`);
        await connection.query(`
            CREATE PROCEDURE Delete_Campaign(IN Campaign_ID_ INT)
            BEGIN
                UPDATE campaign SET Delete_Status = 1 WHERE Campaign_ID = Campaign_ID_;
                SELECT Campaign_ID_ AS Campaign_ID;
            END;
        `);
        console.log("Created Delete_Campaign.");

        // 5. Insert Campaign menu
        const [menuResult] = await connection.query(`
            INSERT INTO menu (Menu_Name, Route, Parent_Menu_ID, Delete_Status)
            SELECT 'Campaign', '/admin/Campaign', NULL, 0
            FROM DUAL
            WHERE NOT EXISTS (SELECT 1 FROM menu WHERE Menu_Name = 'Campaign');
        `);
        if (menuResult.affectedRows > 0) {
            console.log("Campaign menu inserted.");
        } else {
            console.log("Campaign menu already exists.");
        }

        // 6. Assign permissions to Admin users (User_Type_Id = 1)
        const [campaignMenu] = await connection.query("SELECT Menu_ID FROM menu WHERE Menu_Name = 'Campaign'");
        if (campaignMenu.length > 0) {
            const campaignId = campaignMenu[0].Menu_ID;
            const [admins] = await connection.query("SELECT User_ID FROM users WHERE User_Type_Id = 1");
            for (const admin of admins) {
                await connection.query(`
                    INSERT INTO user_menu_selection (Menu_Id, User_Id, IsEdit, IsSave, IsDelete, IsView, DeleteStatus)
                    SELECT ?, ?, 1, 1, 1, 1, 0
                    FROM DUAL
                    WHERE NOT EXISTS (SELECT 1 FROM user_menu_selection WHERE Menu_Id = ? AND User_Id = ?);
                `, [campaignId, admin.User_ID, campaignId, admin.User_ID]);
            }
            console.log("Campaign menu permissions assigned to admins.");
        }

        await connection.end();
        console.log("All Campaign DB changes applied.");
    } catch (e) {
        console.error("Error setting up Campaign DB:", e);
        if (connection) await connection.end();
    }
}

setupCampaign();
