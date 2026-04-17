const db = require('./config/dbconnection.js');
db.query('SELECT * FROM menu WHERE Menu_Name = "Enquiry Source"', (e, r) => {
  if (e) { console.error(e); process.exit(1); }
  console.log('Menu:', r);
  if (r.length > 0) {
    db.query('SELECT * FROM user_menu_selection WHERE Menu_Id = ' + r[0].Menu_ID, (e2, r2) => {
      if (e2) { console.error(e2); process.exit(1); }
      console.log('Selection:', r2);
      process.exit();
    });
  } else {
    console.log('Menu not found');
    process.exit();
  }
});
