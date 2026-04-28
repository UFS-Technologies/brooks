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
            const messageId = payload['message-id'];

            if ((event === 'opened' || event === 'open' || event === 'first_opening' || event === 'unique_opened') && messageId) {
                console.log(`Email opened detected (${event}) for messageId: ${messageId}`);
                await emailLog.Update_Email_Opened(messageId);
            } else {
                console.log(`Email event: ${event} for messageId: ${messageId}`);
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
