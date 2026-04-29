var express = require('express');
var router = express.Router();
const emailLog = require('../models/email_log');

const fs = require('fs');
const path = require('path');

// Ping test for connectivity
router.get('/brevo', (req, res) => {
    res.json({ status: "Webhook is alive", time: new Date().toISOString() });
});

// Brevo Webhook Handler
router.post('/brevo', async (req, res) => {
    try {
        let payloads = req.body;
        
        // Handle both single objects and arrays of payloads
        if (!Array.isArray(payloads)) {
            payloads = [payloads];
        }

        console.log(`Received ${payloads.length} payload(s) from Brevo`);

        for (const payload of payloads) {
            // Log to file for debugging
            const logMsg = `[${new Date().toISOString()}] Payload: ${JSON.stringify(payload)}\n`;
            fs.appendFileSync(path.join(__dirname, '../webhook_debug.log'), logMsg);
            
            const event = payload.event;
            let messageId = payload['message-id'] || payload['messageId'];

            console.log(`Processing Brevo event: ${event} for messageId: ${messageId}`);

            if ((event === 'opened' || event === 'open' || event === 'first_opening' || event === 'unique_opened' || event === 'proxy_open' || event === 'click' || event === 'clicked') && messageId) {
                console.log(`Email opened/clicked detected (${event}) for messageId: ${messageId}`);
                await emailLog.Update_Email_Opened(messageId);
                
                // Fallback: if messageId has angle brackets, try without them, and vice versa
                if (messageId.startsWith('<') && messageId.endsWith('>')) {
                    const cleanId = messageId.substring(1, messageId.length - 1);
                    console.log(`Trying fallback without brackets: ${cleanId}`);
                    await emailLog.Update_Email_Opened(cleanId);
                } else {
                    const bracketId = `<${messageId}>`;
                    console.log(`Trying fallback with brackets: ${bracketId}`);
                    await emailLog.Update_Email_Opened(bracketId);
                }
            } else {
                console.log(`Email event: ${event} for messageId: ${messageId} (No action taken)`);
            }
        }

        res.status(200).json({ success: true });
    } catch (error) {
        const errLog = `[${new Date().toISOString()}] Error: ${error.message}\n`;
        fs.appendFileSync(path.join(__dirname, '../webhook_debug.log'), errLog);
        console.error('Brevo Webhook error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


module.exports = router;
