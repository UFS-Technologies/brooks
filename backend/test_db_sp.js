const db = require('./config/dbconnection');

async function testDB() {
  try {
    const [rows] = await db.promise().query("SHOW CREATE PROCEDURE Get_Email_Template");
    console.log("SP:", rows[0]['Create Procedure']);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

testDB();
