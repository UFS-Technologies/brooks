const axios = require('axios');

const sendEmail = async (to, subject, html, fromEmail = null, fromName = null) => {
    try {
        const apiKey = (process.env.BREVO_API_KEY || '').trim().replace(/^['\"]|['\"]$/g, '');
        
        if (!to) {
            throw new Error('Recipient email (to) is missing');
        }

        if (!apiKey) {
            throw new Error('BREVO_API_KEY is missing in environment variables');
        }

        // Always use the verified sender from .env — ignore fromEmail passed by frontend for the 'sender' field.
        // The frontend sends the logged-in admin's email (e.g. admin_user@G.COM) as the sender,
        // which is NOT verified in Brevo. Brevo silently drops such emails even when returning 201.
        const senderEmail = (process.env.BREVO_SENDER_EMAIL || '').trim().replace(/^['\"]|['\"]$/g, '');
        const senderName = (process.env.BREVO_SENDER_NAME || 'Trackbox').trim().replace(/^['\"]|['\"]$/g, '');
        
        let finalSenderEmail = senderEmail;
        if (!finalSenderEmail) {
            finalSenderEmail = 'info@trackbox.in';
            console.warn('WARNING: BREVO_SENDER_EMAIL is not set in environment. Falling back to:', finalSenderEmail);
        }

        console.log('Brevo API sendEmail request preparation:', { 
            to, 
            subject, 
            verifiedSender: finalSenderEmail,
            originalFrom: fromEmail,
            usingFallback: !senderEmail
        });

        const wrappedHtml = `
            <!DOCTYPE html>
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    ${html}
                </body>
            </html>
        `;

        console.log(`>>> Sending email TO: [${to}] | FROM: [${finalSenderEmail}] | SUBJECT: [${subject}]`);

        const emailData = {
            sender: {
                name: senderName,
                email: finalSenderEmail
            },
            to: [{
                email: to
            }],
            subject: subject,
            htmlContent: wrappedHtml
        };

        // If a fromEmail was provided (e.g. the admin's email), set it as the reply-to address
        // so that student replies go to the person who actually sent the email.
        if (fromEmail && fromEmail !== finalSenderEmail) {
            emailData.replyTo = {
                email: fromEmail,
                name: fromName || fromEmail
            };
        }

        const response = await axios({
            method: 'post',
            url: 'https://api.brevo.com/v3/smtp/email',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            data: emailData
        });
        
        console.log('Brevo API response success - status:', response.status, '| data:', JSON.stringify(response.data));
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
