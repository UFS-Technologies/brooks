const axios = require('axios');

const sendEmail = async (to, subject, html, fromEmail = null, fromName = null) => {
    try {
        const apiKey = (process.env.BREVO_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
        
        console.log('Brevo API sendEmail request:', { 
            to, 
            subject, 
            fromEmail,
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
        let senderEmail = fromEmail || (process.env.BREVO_SENDER_EMAIL || '').trim().replace(/^['"]|['"]$/g, '');
        if (!senderEmail || senderEmail === 'your_sender_email@example.com') {
            senderEmail = 'info@trackbox.in'; // Default to rebranded email
        }

        const senderName = fromName || (process.env.BREVO_SENDER_NAME || 'Trackbox').trim().replace(/^['"]|['"]$/g, '');

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
        let errorMessage = error.message;
        if (error.response && error.response.data) {
            errorMessage = error.response.data.message || error.response.data.code || JSON.stringify(error.response.data);
        }

        console.error('Error sending email via Brevo API:', {
            message: errorMessage,
            originalError: error.message,
            responseData: error.response ? error.response.data : 'No response data',
            to: to,
            apiKeyFound: !!process.env.BREVO_API_KEY
        });

        const enhancedError = new Error(errorMessage);
        enhancedError.originalError = error;
        enhancedError.responseData = error.response ? error.response.data : null;
        throw enhancedError;
    }
};

module.exports = {
    sendEmail
};
