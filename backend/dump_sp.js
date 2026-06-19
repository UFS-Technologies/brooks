const db = require('./config/dbconnection');
async function dumpSP() {
  const [rows] = await db.promise().query("SHOW CREATE PROCEDURE Save_student");
  console.log(rows[0]['Create Procedure']);
  process.exit(0);
}
dumpSP().catch(e => console.error(e));
