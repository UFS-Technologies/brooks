const axios = require('axios');

async function triggerError() {
    try {
        const response = await axios.post('http://localhost:3520/Login/Login_Check', {
            email: 'wrong@user.com',
            password: 'wrongpassword'
        });
        console.log("Response:", response.data);
    } catch (error) {
        if (error.response) {
            console.log("Status:", error.response.status);
            console.log("Headers:", error.response.headers['content-type']);
            console.log("Data:", error.response.data);
        } else {
            console.error("Error:", error.message);
        }
    }
}

triggerError();
