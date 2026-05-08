require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'aives_db',
    multipleStatements: true
};

async function run() {
    const conn = await mysql.createConnection(config);
    console.log('Connected to database.');

    // 1. Create table
    await conn.query(`
        CREATE TABLE IF NOT EXISTS \`facebook_leads\` (
            \`Lead_ID\`    INT          NOT NULL AUTO_INCREMENT,
            \`name\`       VARCHAR(255) NOT NULL,
            \`phone\`      VARCHAR(50)  NOT NULL,
            \`location\`   VARCHAR(255) DEFAULT NULL,
            \`model\`      VARCHAR(255) DEFAULT NULL,
            \`date\`       DATE         DEFAULT NULL,
            \`created_at\` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            \`updated_at\` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (\`Lead_ID\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Table facebook_leads created (or already exists).');

    // 2. Save_Facebook_Lead SP
    await conn.query(`DROP PROCEDURE IF EXISTS Save_Facebook_Lead`);
    await conn.query(`
        CREATE PROCEDURE Save_Facebook_Lead(
            IN p_Lead_ID   INT,
            IN p_name      VARCHAR(255),
            IN p_phone     VARCHAR(50),
            IN p_location  VARCHAR(255),
            IN p_model     VARCHAR(255),
            IN p_date      DATE
        )
        BEGIN
            IF p_Lead_ID = 0 THEN
                INSERT INTO facebook_leads (name, phone, location, model, date)
                VALUES (p_name, p_phone, p_location, p_model, p_date);
                SELECT LAST_INSERT_ID() AS Lead_ID, 'Lead saved successfully' AS message;
            ELSE
                UPDATE facebook_leads
                SET name = p_name, phone = p_phone, location = p_location,
                    model = p_model, date = p_date
                WHERE Lead_ID = p_Lead_ID;
                SELECT p_Lead_ID AS Lead_ID, 'Lead updated successfully' AS message;
            END IF;
        END
    `);
    console.log('✅ Stored procedure Save_Facebook_Lead created.');

    // 3. Search_Facebook_Lead SP
    await conn.query(`DROP PROCEDURE IF EXISTS Search_Facebook_Lead`);
    await conn.query(`
        CREATE PROCEDURE Search_Facebook_Lead(
            IN p_search VARCHAR(255)
        )
        BEGIN
            IF p_search = '' OR p_search IS NULL THEN
                SELECT Lead_ID, name, phone, location, model, date, created_at, updated_at
                FROM   facebook_leads
                ORDER  BY created_at DESC;
            ELSE
                SELECT Lead_ID, name, phone, location, model, date, created_at, updated_at
                FROM   facebook_leads
                WHERE  name     LIKE CONCAT('%', p_search, '%')
                    OR phone    LIKE CONCAT('%', p_search, '%')
                    OR location LIKE CONCAT('%', p_search, '%')
                    OR model    LIKE CONCAT('%', p_search, '%')
                ORDER  BY created_at DESC;
            END IF;
        END
    `);
    console.log('✅ Stored procedure Search_Facebook_Lead created.');

    // 4. Delete_Facebook_Lead SP
    await conn.query(`DROP PROCEDURE IF EXISTS Delete_Facebook_Lead`);
    await conn.query(`
        CREATE PROCEDURE Delete_Facebook_Lead(
            IN p_Lead_ID INT
        )
        BEGIN
            DELETE FROM facebook_leads WHERE Lead_ID = p_Lead_ID;
            SELECT ROW_COUNT() AS affected_rows, 'Lead deleted successfully' AS message;
        END
    `);
    console.log('✅ Stored procedure Delete_Facebook_Lead created.');

    await conn.end();
    console.log('\n🎉 All done! facebook_leads table and stored procedures are ready.');
}

run().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
