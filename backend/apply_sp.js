const fs = require('fs');
const db = require('./config/dbconnection');

const sql = fs.readFileSync('Search_student_lead_definition.sql', 'utf8');

db.query('DROP PROCEDURE IF EXISTS Search_student_lead', (err) => {
    if (err) {
        console.error('Error dropping SP:', err);
        process.exit(1);
    }
    db.query(sql, (err) => {
        if (err) {
            console.error('Error creating SP:', err);
            process.exit(1);
        }
        console.log('Stored procedure Search_student_lead updated successfully in the database.');
        process.exit(0);
    });
});
