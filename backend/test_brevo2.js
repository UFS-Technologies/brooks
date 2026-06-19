require('dotenv').config();
const emailHelper = require('./helpers/email-helper');

async function testEmail() {
  try {
    const res = await emailHelper.sendEmail(
      'anusreeprabhakaran90@gmail.com', // Valid recipient (from user screenshot)
      'Test Subject',
      '<p>Test</p>',
      'invalidemail', // Invalid reply-to
      'Admin Name'
    );
    console.log(res);
  } catch (err) {
    if (err.responseData) {
      console.log(JSON.stringify(err.responseData));
    } else {
      console.log(err.message);
    }
  }
}
testEmail();
