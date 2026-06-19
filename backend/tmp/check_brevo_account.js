const axios = require('axios');
require('dotenv').config({ path: 'c:/Users/SAPNA/Documents/GitHub/brooks/backend/.env' });

async function checkAccount() {
    const apiKey = (process.env.BREVO_API_KEY || '').trim().replace(/^['\"]|['\"]$/g, '');
    
    if (!apiKey) {
        console.error('Error: BREVO_API_KEY not found in .env file');
        process.exit(1);
    }

    console.log('Checking Brevo Account for API Key (starts with):', apiKey.substring(0, 10) + '...');

    try {
        const response = await axios({
            method: 'get',
            url: 'https://api.brevo.com/v3/account',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey
            }
        });

        console.log('\n--- Brevo Account Details ---');
        console.log('Company Name:', response.data.companyName);
        console.log('Admin Email:', response.data.email);
        console.log('Plan:', response.data.plan.map(p => p.type).join(', '));
        console.log('Relay Allowed:', response.data.relay.enabled ? 'Yes' : 'No');
        console.log('-----------------------------\n');
        
        console.log('If these details do not match the account in your browser screenshot, you are using the wrong API Key.');

    } catch (error) {
        console.error('Error fetching account details:', error.response ? error.response.data : error.message);
    }
}

checkAccount();
