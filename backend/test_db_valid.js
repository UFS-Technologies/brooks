const db = require('./config/dbconnection');
const email_template = require('./models/email_template');

async function testDB() {
  try {
    const templates = await email_template.Get_Email_Template(3);
    console.log("Templates:", templates);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

testDB();
