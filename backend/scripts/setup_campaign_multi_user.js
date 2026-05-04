const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "avies_db",
    multipleStatements: true,
};

async function setupCampaignMultiUser() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to DB.");

        // 1. Create campaign_user table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS campaign_user (
                Campaign_ID INT,
                User_ID INT,
                PRIMARY KEY (Campaign_ID, User_ID),
                FOREIGN KEY (Campaign_ID) REFERENCES campaign(Campaign_ID),
                FOREIGN KEY (User_ID) REFERENCES users(User_ID)
            );
        `);
        console.log("campaign_user table created/verified.");

        // 2. Remove User_ID from campaign if it exists
        try {
            await connection.query("ALTER TABLE campaign DROP FOREIGN KEY campaign_ibfk_1");
            await connection.query("ALTER TABLE campaign DROP COLUMN User_ID");
            console.log("User_ID column dropped from campaign table.");
        } catch (e) {
            console.log("User_ID column already dropped or foreign key not found.");
        }

        // 3. Update Save_Campaign procedure to handle JSON array of user IDs
        await connection.query(`DROP PROCEDURE IF EXISTS Save_Campaign;`);
        await connection.query(`
            CREATE PROCEDURE Save_Campaign(
                IN Campaign_ID_ INT,
                IN Campaign_Name_ VARCHAR(255),
                IN Campaign_Number_ VARCHAR(100),
                IN User_IDs_ JSON
            )
            BEGIN
                DECLARE campaignId INT;
                DECLARE userIndex INT DEFAULT 0;
                DECLARE userCount INT;

                IF Campaign_ID_ > 0 THEN
                    UPDATE campaign
                    SET Campaign_Name = Campaign_Name_, Campaign_Number = Campaign_Number_
                    WHERE Campaign_ID = Campaign_ID_;
                    SET campaignId = Campaign_ID_;
                    
                    -- Remove existing users for this campaign
                    DELETE FROM campaign_user WHERE Campaign_ID = campaignId;
                ELSE
                    INSERT INTO campaign (Campaign_Name, Campaign_Number)
                    VALUES (Campaign_Name_, Campaign_Number_);
                    SET campaignId = LAST_INSERT_ID();
                END IF;

                -- Insert new users from JSON array
                SET userCount = JSON_LENGTH(User_IDs_);
                WHILE userIndex < userCount DO
                    INSERT INTO campaign_user (Campaign_ID, User_ID)
                    VALUES (campaignId, CAST(JSON_EXTRACT(User_IDs_, CONCAT('$[', userIndex, ']')) AS UNSIGNED));
                    SET userIndex = userIndex + 1;
                END WHILE;

                SELECT campaignId AS Campaign_ID;
            END;
        `);
        console.log("Updated Save_Campaign for multi-user support.");

        // 4. Update Search_Campaign procedure to return users list
        await connection.query(`DROP PROCEDURE IF EXISTS Search_Campaign;`);
        await connection.query(`
            CREATE PROCEDURE Search_Campaign(IN Campaign_Name_ VARCHAR(255))
            BEGIN
                SELECT 
                    c.*, 
                    (
                        SELECT GROUP_CONCAT(CONCAT(u.First_Name, ' ', u.Last_Name) SEPARATOR ', ')
                        FROM campaign_user cu
                        JOIN users u ON cu.User_ID = u.User_ID
                        WHERE cu.Campaign_ID = c.Campaign_ID
                    ) AS User_Names,
                    (
                        SELECT JSON_ARRAYAGG(cu.User_ID)
                        FROM campaign_user cu
                        WHERE cu.Campaign_ID = c.Campaign_ID
                    ) AS User_IDs
                FROM campaign c
                WHERE (Campaign_Name_ = '' OR c.Campaign_Name LIKE CONCAT('%', Campaign_Name_, '%'))
                AND c.Delete_Status = 0
                ORDER BY c.Created_At DESC;
            END;
        `);
        console.log("Updated Search_Campaign for multi-user support.");

        await connection.end();
        console.log("All Multi-User Campaign DB changes applied.");
    } catch (e) {
        console.error("Error setting up Multi-User Campaign DB:", e);
        if (connection) await connection.end();
    }
}

setupCampaignMultiUser();
