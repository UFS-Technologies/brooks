const db = require("../backend/config/dbconnection");

async function check() {
  try {
    const [studentCols] = await db.promise().query("DESCRIBE student");
    console.log("Student columns:", studentCols.map(c => `${c.Field} (${c.Type})`));

    const [followupCols] = await db.promise().query("DESCRIBE student_followup");
    console.log("Followup columns:", followupCols.map(c => `${c.Field} (${c.Type})`));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

check();
