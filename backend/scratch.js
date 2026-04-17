const db = require('./config/dbconnection.js');
db.query('SELECT * FROM user_menu_selection LIMIT 5', (e, r) => {
  console.log(e ? e.sqlMessage : r);
  db.query("INSERT INTO menu (Menu_Name, Route, Delete_Status) VALUES ('Enquiry Source', '/admin/Enquiry_Source', 0)", (e2, r2) => {
    console.log(e2 ? e2.sqlMessage : r2);
    // and assign this menu to user 1 who is admin
    const insertId = r2.insertId;
    db.query(`INSERT INTO user_menu_selection (User_ID, Menu_ID) SELECT 1, ${insertId} WHERE NOT EXISTS(SELECT 1 FROM user_menu_selection WHERE User_ID=1 AND Menu_ID=${insertId})`, (e3, r3) => {
        console.log(e3 ? e3.sqlMessage : r3);
        process.exit();
    })
  });
});
