const connection = require('./config/dbconnection.js');
connection.query("INSERT IGNORE INTO menu (Menu_ID, Menu_Name, Route, Parent_Menu_ID, Delete_Status) VALUES (27, 'My Students', '/admin/My_Students', null, 0)", (err) => {
    if (err) console.error(err);
    connection.query("INSERT IGNORE INTO user_menu_selection (Menu_ID, User_Id, IsView, IsSave, IsEdit, IsDelete) SELECT 27, User_Id, 1, 1, 1, 1 FROM users", (err) => {
        if (err) console.error(err);
        console.log("Done");
        process.exit();
    });
});
