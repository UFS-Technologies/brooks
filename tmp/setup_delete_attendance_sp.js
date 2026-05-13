const mysql = require('mysql2/promise');

async function setup() {
    const connection = await mysql.createConnection({
        host: "localhost",
        user: 'root',
        password: 'root',
        database: "brooks",
    });

    try {
        console.log('Creating Delete_Attendance stored procedure...');
        
        await connection.query('DROP PROCEDURE IF EXISTS Delete_Attendance;');
        
        await connection.query(`
            CREATE PROCEDURE Delete_Attendance(
                IN p_courseId INT,
                IN p_batchId INT,
                IN p_date VARCHAR(20)
            )
            BEGIN
                DELETE FROM attendance 
                WHERE Course_ID = p_courseId 
                AND Batch_ID = p_batchId 
                AND Attendance_Date = p_date;
                
                SELECT 1 as success;
            END
        `);

        console.log('Stored procedure created successfully!');
    } catch (error) {
        console.error('Error creating stored procedure:', error);
    } finally {
        await connection.end();
    }
}

setup();
