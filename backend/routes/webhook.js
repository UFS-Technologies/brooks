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
            // Log to scratch folder for guaranteed write access and visibility
            try {
                const logMsg = `[${new Date().toISOString()}] Payload: ${JSON.stringify(payload)}\n`;
                // Try multiple locations just in case
                fs.appendFileSync(path.join(__dirname, '../webhook_debug.log'), logMsg);
                fs.appendFileSync(path.join(__dirname, '../../scratch/webhook_hits.log'), logMsg);
            } catch (logError) {
                console.error('Failed to write to logs:', logError.message);
            }
            
            const event = (payload.event || '').toLowerCase();
            // Robust extraction of message-id from various possible fields
            let messageId = payload['message-id'] || 
                            payload['messageId'] || 
                            payload['message_id'] || 
                            payload['Message-Id'] || 
                            payload['Message-ID'] ||
                            (payload.metadata && (payload.metadata['message-id'] || payload.metadata['messageId']));

            console.log(`Processing Brevo event: ${event} for messageId: ${messageId}`);

            // Expanded list of "opened" or "clicked" events - included every variation possible
            const openEvents = [
                'opened', 'open', 'first_opening', 'firstopening', 'fisrtopening', 
                'unique_opened', 'proxy_open', 'click', 'clicked', 'first_open',
                'firstopening', 'opened_unique', 'opening'
            ];

            if (openEvents.includes(event) && messageId) {
                console.log(`Email opened/clicked detected (${event}) for messageId: ${messageId}`);
                await emailLog.Update_Email_Opened(messageId);
                
                // Fallback: if messageId has angle brackets, try without them, and vice versa
                if (typeof messageId === 'string') {
                    const cleanId = messageId.startsWith('<') && messageId.endsWith('>') 
                        ? messageId.substring(1, messageId.length - 1) 
                        : messageId;
                    
                    const bracketId = `<${cleanId}>`;
                    
                    console.log(`Updating for clean ID: ${cleanId} and bracketed ID: ${bracketId}`);
                    await emailLog.Update_Email_Opened(cleanId);
                    await emailLog.Update_Email_Opened(bracketId);
                }
            } else {
                console.log(`Email event: ${event} for messageId: ${messageId} (No action taken)`);
            }
        }

        res.status(200).json({ success: true });
    } catch (error) {
        try {
            const errLog = `[${new Date().toISOString()}] Error: ${error.message}\n`;
            fs.appendFileSync(path.join(__dirname, '../../scratch/webhook_hits.log'), errLog);
        } catch (logError) {}
        console.error('Brevo Webhook error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


module.exports = router;
