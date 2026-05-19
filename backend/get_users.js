const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'avies_db'
});

connection.query('SELECT User_ID, First_Name, Last_Name, Email, password, User_Type_Id, User_Role_Id FROM users WHERE Delete_Status = 0 LIMIT 10;', (err, results) => {
    if (err) {
        console.error('Error fetching users:', err);
    } else {
        console.log('Users list:', JSON.stringify(results, null, 2));
    }
    connection.end();
});
