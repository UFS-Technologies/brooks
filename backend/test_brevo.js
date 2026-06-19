require('dotenv').config();
const emailHelper = require('./helpers/email-helper');

async function testEmail() {
  try {
    const res = await emailHelper.sendEmail(
      'invalid_email', // Invalid recipient
      'Test Subject',
      '<p>Test</p>',
      'admin', // Invalid reply-to
      'Admin Name'
    );
    console.log(res);
  } catch (err) {
    console.log(err.message);
  }
}
testEmail();
