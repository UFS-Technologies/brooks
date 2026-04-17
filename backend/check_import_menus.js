const db = require('./config/dbconnection.js');
db.query('SELECT * FROM menu WHERE Menu_Name = "Import"', (e, r) => {
  if (e) { console.error(e); process.exit(1); }
  console.log('Menus found:', JSON.stringify(r, null, 2));
  process.exit();
});
