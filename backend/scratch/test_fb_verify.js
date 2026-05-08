const axios = require('axios');

async function testVerification() {
    const port = 3520;
    const verifyToken = 'sarathy_lead_verify_token';
    const challenge = 'test_challenge_123';
    const url = `http://localhost:${port}/webhook/facebook?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=${challenge}`;

    try {
        console.log(`Testing URL: ${url}`);
        const response = await axios.get(url);
        console.log('Status:', response.status);
        console.log('Response Body:', response.data);
        
        if (response.data === challenge) {
            console.log('SUCCESS: Verification endpoint is working correctly.');
        } else {
            console.log('FAILURE: Response did not match challenge.');
        }
    } catch (error) {
        console.error('ERROR:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
    }
}

testVerification();
