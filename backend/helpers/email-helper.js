const axios = require('axios');

const sendEmail = async (to, subject, html) => {
    try {
        const apiKey = (process.env.BREVO_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
        
        console.log('Brevo API sendEmail request:', { 
            to, 
            subject, 
            apiKeyLength: apiKey.length,
            apiKeyStart: apiKey.substring(0, 5)
        });

        if (!to) {
            throw new Error('Recipient email (to) is missing');
        }

        const wrappedHtml = `
            <!DOCTYPE html>
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    ${html}
                </body>
            </html>
        `;

        // Try to determine the best sender
        let senderEmail = (process.env.BREVO_SENDER_EMAIL || '').trim().replace(/^['"]|['"]$/g, '');
        if (!senderEmail || senderEmail === 'your_sender_email@example.com') {
            senderEmail = 'info@trackbox.in'; // Default to rebranded email
        }

        const senderName = (process.env.BREVO_SENDER_NAME || 'Trackbox').trim().replace(/^['"]|['"]$/g, '');

        const response = await axios({
            method: 'post',
            url: 'https://api.brevo.com/v3/smtp/email',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            data: {
                sender: {
                    name: senderName,
                    email: senderEmail
                },
                to: [{
                    email: to
                }],
                subject: subject,
                htmlContent: wrappedHtml
            }
        });
        
        console.log('Brevo API response success:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending email via Brevo API:', {
            message: error.message,
            responseData: error.response ? error.response.data : 'No response data',
            to: to,
            apiKeyFound: !!process.env.BREVO_API_KEY
        });
        throw error;
    }
};

module.exports = {
    sendEmail
};
