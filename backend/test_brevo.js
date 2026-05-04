const emailHelper = require('./helpers/email-helper');
require('dotenv').config();

async function testBrevo() {
    try {
        console.log('Testing Brevo API with Key:', process.env.BREVO_API_KEY ? 'FOUND' : 'MISSING');
        console.log('Sender Email:', process.env.BREVO_SENDER_EMAIL);
        
        const response = await emailHelper.sendEmail('work@ufstechnologies.com', 'Test Email', 'This is a test email from the backend.');
        console.log('Test Success:', response);
        process.exit(0);
    } catch (error) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

testBrevo();
