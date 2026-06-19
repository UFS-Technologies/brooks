const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "aives_db",
    multipleStatements: true,
});

async function run() {
    console.log("Creating mock_test_packages table...");
    try {
        await connection.promise().query(`
            CREATE TABLE IF NOT EXISTS mock_test_packages (
                Package_ID INT AUTO_INCREMENT PRIMARY KEY,
                Package_Name VARCHAR(255) NOT NULL,
                Delete_Status TINYINT(1) DEFAULT 0
            )
        `);
        console.log("mock_test_packages table created or exists.");
    } catch (e) {
        console.error("Failed to create table:", e);
    }

    console.log("Creating Stored Procedures...");

    const spSave = `
DROP PROCEDURE IF EXISTS Save_MockTestPackage;
CREATE PROCEDURE Save_MockTestPackage(
    IN Package_ID_ INT,
    IN Package_Name_ VARCHAR(255)
)
BEGIN
    IF Package_ID_ > 0 THEN
        UPDATE mock_test_packages
        SET Package_Name = Package_Name_
        WHERE Package_ID = Package_ID_;
        
        SELECT Package_ID_ AS Package_ID;
    ELSE
        INSERT INTO mock_test_packages (Package_Name, Delete_Status)
        VALUES (Package_Name_, 0);
        
        SELECT LAST_INSERT_ID() AS Package_ID;
    END IF;
END
    `;

    const spGet = `
DROP PROCEDURE IF EXISTS Get_MockTestPackages;
CREATE PROCEDURE Get_MockTestPackages()
BEGIN
    SELECT Package_ID, Package_Name
    FROM mock_test_packages
    WHERE Delete_Status = 0
    ORDER BY Package_ID DESC;
END
    `;

    const spDelete = `
DROP PROCEDURE IF EXISTS Delete_MockTestPackage;
CREATE PROCEDURE Delete_MockTestPackage(
    IN Package_ID_ INT
)
BEGIN
    UPDATE mock_test_packages
    SET Delete_Status = 1
    WHERE Package_ID = Package_ID_;
    
    SELECT 1 AS Status;
END
    `;

    try {
        await connection.promise().query(spSave);
        console.log("Save_MockTestPackage SP created.");
        
        await connection.promise().query(spGet);
        console.log("Get_MockTestPackages SP created.");
        
        await connection.promise().query(spDelete);
        console.log("Delete_MockTestPackage SP created.");

        // Insert default packages if table is empty
        const [rows] = await connection.promise().query("SELECT COUNT(*) AS count FROM mock_test_packages");
        if (rows[0].count === 0) {
            await connection.promise().query(`
                INSERT INTO mock_test_packages (Package_Name) VALUES 
                ('IELTS Mock Test Package'),
                ('PTE Practice Test Series'),
                ('OET Mock Test Package'),
                ('Premium Mock Test Bundle')
            `);
            console.log("Inserted default packages.");
        }
    } catch (e) {
        console.error("Failed to create SPs:", e);
    }

    process.exit(0);
}
run();
