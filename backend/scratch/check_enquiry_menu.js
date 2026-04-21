const db = require('./config/dbconnection.js');
db.query('SELECT * FROM menu WHERE Menu_Name LIKE "%Enquiry%"', (e, r) => {
  if (e) {
    console.error(e);
    process.exit(1);
  }
  console.log('--- Menu Table (Enquiry related) ---');
  console.table(r);
  
  if (r.length > 0) {
    const ids = r.map(m => m.Menu_ID);
    db.query('SELECT ums.*, u.First_Name FROM user_menu_selection ums JOIN users u ON ums.User_Id = u.User_ID WHERE ums.Menu_Id IN (' + ids.join(',') + ')', (e2, r2) => {
      if (e2) {
        console.error(e2);
        process.exit(1);
      }
      console.log('--- User Menu Selection (Permissions) ---');
      console.table(r2);
      process.exit();
    });
  } else {
    console.log('No Enquiry related menus found.');
    process.exit();
  }
});
