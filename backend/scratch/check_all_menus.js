const mysql = require('mysql2/promise');
const dbConfig = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "brooks_db",
    multipleStatements: true,
};

async function checkAllMenus() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        const expectedMenus = [
            'Dashboard', 'Lead', 'Import', 'Student', 'Expenses', 'Income', 'Staff', 
            'Enquiry Source', 'Enquiry Summary', 'Expense Category', 'Expense Type', 
            'Course', 'Student Reports', 'Exam Upload', 'Studentfile upload', 
            'Fees Total Outstanding', 'Upcoming Installment', 'Due Instalment', 
            'Reports', 'Work Report', 'Enquiry Conversion', 'Status'
        ];
        
        const [rows] = await connection.query("SELECT Menu_Name, Route FROM menu");
        const existingMenus = rows.map(r => r.Menu_Name);
        
        console.log("Existing Menus in DB:");
        console.log(existingMenus);
        
        const missingMenus = expectedMenus.filter(m => !existingMenus.includes(m));
        console.log("\nMissing Menus:");
        console.log(missingMenus);
        
        const [procRows] = await connection.query(`
            SELECT ROUTINE_DEFINITION 
            FROM information_schema.ROUTINES 
            WHERE ROUTINE_TYPE = 'PROCEDURE' 
              AND ROUTINE_SCHEMA = 'brooks_db'
              AND ROUTINE_NAME = 'Get_user_Menus'
        `);
        if (procRows.length > 0) {
            console.log("\nPROCEDURE Get_user_Menus definition:");
            console.log(procRows[0].ROUTINE_DEFINITION);
        } else {
            console.log("\nPROCEDURE Get_user_Menus not found.");
        }
        
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}

checkAllMenus();
