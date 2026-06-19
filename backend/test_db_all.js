const db = require('./config/dbconnection');

async function testDB() {
  try {
    const [rows] = await db.promise().query('SELECT * FROM Email_Templates');
    console.log("Templates:", rows);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

testDB();
