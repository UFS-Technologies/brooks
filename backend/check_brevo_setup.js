const axios = require('axios');
require('dotenv').config();

async function checkBrevoAccount() {
    const apiKey = (process.env.BREVO_API_KEY || '').trim().replace(/^['\"]|['\"]$/g, '');
    const senderEmail = (process.env.BREVO_SENDER_EMAIL || '').trim().replace(/^['\"]|['\"]$/g, '');

    console.log('Checking Brevo API for Account Info...');
    console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
    console.log('Configured Sender:', senderEmail);

    try {
        // 1. Get Account Info
        const accountResponse = await axios({
            method: 'get',
            url: 'https://api.brevo.com/v3/account',
            headers: { 'api-key': apiKey }
        });
        console.log('\n--- Account Info ---');
        console.log('Account Name:', accountResponse.data.companyName);
        console.log('Account Email:', accountResponse.data.email);

        // 2. Get Senders
        const sendersResponse = await axios({
            method: 'get',
            url: 'https://api.brevo.com/v3/senders',
            headers: { 'api-key': apiKey }
        });
        console.log('\n--- Verified Senders ---');
        const senders = sendersResponse.data.senders || [];
        senders.forEach(s => {
            console.log(`- [${s.active ? 'ACTIVE' : 'INACTIVE'}] ${s.name} (${s.email})`);
        });

        const isVerified = senders.some(s => s.email.toLowerCase() === senderEmail.toLowerCase() && s.active);
        console.log('\nResult:', isVerified ? `SUCCESS: ${senderEmail} is a verified and active sender.` : `WARNING: ${senderEmail} is NOT found or NOT active in this account.`);

    } catch (error) {
        console.error('\nError connecting to Brevo:', error.response ? error.response.data : error.message);
    }
}

checkBrevoAccount();
