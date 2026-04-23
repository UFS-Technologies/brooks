const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
};

async function verifyAPI() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        // Call the stored procedure directly for user ID 1
        const [rows] = await connection.query("CALL Get_user_Menus(?)", [1]);
        
        // rows[0] contains the result set from the first SELECT in the SP
        const menus = rows[0];
        const enquiryConversion = menus.find(m => m.Menu_Name === 'Enquiry Conversion');
        
        if (enquiryConversion) {
            console.log("SUCCESS: Enquiry Conversion found in API response.");
            console.log(JSON.stringify(enquiryConversion, null, 2));
        } else {
            console.error("FAILURE: Enquiry Conversion NOT found in API response.");
            console.log("All Menus:", menus.map(m => m.Menu_Name));
        }
        
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

verifyAPI();
