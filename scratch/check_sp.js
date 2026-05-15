const db = require('../backend/config/dbconnection');

async function checkSP() {
    try {
        const [rows] = await db.promise().query("SHOW CREATE PROCEDURE Get_upcomming_installments");
        console.log('SP Definition (Upcoming):', rows[0]['Create Procedure']);
        
        const [rows2] = await db.promise().query("SHOW CREATE PROCEDURE Get_Due_installments");
        console.log('SP Definition (Due):', rows2[0]['Create Procedure']);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkSP();
