const axios = require('axios');

async function testEmail() {
  try {
    const res = await axios.post('http://localhost:3520/EmailTemplate/Send_Email_With_Template', {
      Template_ID: 1, // Let's guess 1
      To_Email: 'test@example.com',
      Placeholders: {
        'Student Name': 'Test Student',
        'Lead Name': 'Test Student',
        'Course Name': 'Test Course'
      },
      Sender_Email: 'info@trackbox.in',
      Sender_Name: 'Admin'
    });
    console.log("Success:", res.data);
  } catch (err) {
    if (err.response) {
      console.log("Error status:", err.response.status);
      console.log("Error data:", JSON.stringify(err.response.data));
      console.log("Response length:", JSON.stringify(err.response.data).length);
    } else {
      console.log("Other error:", err.message);
    }
  }
}

testEmail();
