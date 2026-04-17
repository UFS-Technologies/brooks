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
        
        console.log("Creating Save_Enquiry_Source...");
        await connection.query(`
            DROP PROCEDURE IF EXISTS Save_Enquiry_Source;
        `);
        await connection.query(`
            CREATE PROCEDURE Save_Enquiry_Source(
                IN p_Enquiry_Source_Id INT,
                IN p_Enquiry_Source_Name VARCHAR(255)
            )
            BEGIN
                IF p_Enquiry_Source_Id > 0 THEN
                    UPDATE enquiry_source 
                    SET Enquiry_Source_Name = p_Enquiry_Source_Name
                    WHERE Enquiry_Source_Id = p_Enquiry_Source_Id;
                    
                    SELECT p_Enquiry_Source_Id AS Enquiry_Source_Id, 'Updated Successfully' AS message;
                ELSE
                    INSERT INTO enquiry_source (Enquiry_Source_Name, Delete_Status)
                    VALUES (p_Enquiry_Source_Name, 0);
                    
                    SELECT LAST_INSERT_ID() AS Enquiry_Source_Id, 'Saved Successfully' AS message;
                END IF;
            END
        `);

        console.log("Creating Delete_Enquiry_Source...");
        await connection.query(`
            DROP PROCEDURE IF EXISTS Delete_Enquiry_Source;
        `);
        await connection.query(`
            CREATE PROCEDURE Delete_Enquiry_Source(
                IN p_Enquiry_Source_Id INT
            )
            BEGIN
                UPDATE enquiry_source 
                SET Delete_Status = 1 
                WHERE Enquiry_Source_Id = p_Enquiry_Source_Id;
                
                SELECT p_Enquiry_Source_Id AS Enquiry_Source_Id, 'Deleted Successfully' AS message;
            END
        `);

        console.log("Procedures created successfully.");
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

createProcs();
