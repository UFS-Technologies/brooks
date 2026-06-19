const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

async function checkBrevoAccount() {
    const apiKey = (process.env.BREVO_API_KEY || '').trim().replace(/^['\"]|['\"]$/g, '');
    const senderEmail = (process.env.BREVO_SENDER_EMAIL || '').trim().replace(/^['\"]|['\"]$/g, '');

    let output = '';
    output += `Checking Brevo API for Account Info...\n`;
    output += `API Key (first 10): ${apiKey.substring(0, 10)}...\n`;
    output += `Configured Sender: ${senderEmail}\n`;

    try {
        const accountResponse = await axios({
            method: 'get',
            url: 'https://api.brevo.com/v3/account',
            headers: { 'api-key': apiKey }
        });
        output += `\n--- Account Info ---\n`;
        output += `Account Name: ${accountResponse.data.companyName}\n`;
        output += `Account Email: ${accountResponse.data.email}\n`;

        const sendersResponse = await axios({
            method: 'get',
            url: 'https://api.brevo.com/v3/senders',
            headers: { 'api-key': apiKey }
        });
        output += `\n--- Verified Senders ---\n`;
        const senders = sendersResponse.data.senders || [];
        senders.forEach(s => {
            output += `- [${s.active ? 'ACTIVE' : 'INACTIVE'}] ${s.name} (${s.email})\n`;
        });

        const isVerified = senders.some(s => s.email.toLowerCase() === senderEmail.toLowerCase() && s.active);
        output += `\nResult: ${isVerified ? 'SUCCESS' : 'FAILURE'}\n`;
        
        fs.writeFileSync('brevo_check_result.txt', output);
        console.log('Result saved to brevo_check_result.txt');

    } catch (error) {
        fs.writeFileSync('brevo_check_result.txt', `Error: ${error.message}\n${JSON.stringify(error.response ? error.response.data : {}, null, 2)}`);
        console.log('Error saved to brevo_check_result.txt');
    }
}

checkBrevoAccount();
