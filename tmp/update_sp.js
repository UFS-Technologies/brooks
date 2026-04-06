const mysql = require('mysql2/promise');

async function updateProcedure() {
    const connection = await mysql.createConnection({
        host: "DESKTOP-IK6ME8M",
        user: 'root',
        password: 'root',
        database: "brooks",
    });

    try {
        console.log('Updating Followup_status_Dropdown stored procedure...');
        
        await connection.query('DROP PROCEDURE IF EXISTS Followup_status_Dropdown;');
        
        await connection.query(`
            CREATE PROCEDURE Followup_status_Dropdown()
            BEGIN
                SELECT * FROM followup_status 
                WHERE Delete_Status = 0 AND Is_Active = 1
                ORDER BY Status_Name;
            END
        `);

        console.log('Stored procedure updated successfully!');
    } catch (error) {
        console.error('Error updating stored procedure:', error);
    } finally {
        await connection.end();
    }
}

updateProcedure();
