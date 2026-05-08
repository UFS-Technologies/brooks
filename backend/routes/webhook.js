var express = require('express');
var router = express.Router();
const emailLog = require('../models/email_log');

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const studentModel = require('../models/student');

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
    }
});



// --- Facebook Lead Ads Webhook ---

// Facebook Webhook Verification (GET)
// Meta sends a GET request to verify this endpoint
router.get('/facebook', (req, res) => {
    const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Add logging to see if Meta is actually hitting this endpoint
    const logMsg = `[${new Date().toISOString()}] VERIFICATION ATTEMPT: mode=${mode}, token=${token}, challenge=${challenge}\n`;
    fs.appendFileSync(path.join(__dirname, '../facebook_debug.log'), logMsg);

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('FACEBOOK WEBHOOK VERIFIED');
            res.status(200).send(challenge);
        } else {
            const failMsg = `[${new Date().toISOString()}] VERIFICATION FAILED: Token mismatch. Expected ${VERIFY_TOKEN}, got ${token}\n`;
            fs.appendFileSync(path.join(__dirname, '../facebook_debug.log'), failMsg);
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

// Facebook Lead Notification (POST)
// Meta sends a POST request when a new lead is created
router.post('/facebook', async (req, res) => {
    try {
        const body = req.body;
        // Immediate log to see what we received
        fs.appendFileSync(path.join(__dirname, '../facebook_debug.log'), `[${new Date().toISOString()}] RAW BODY: ${JSON.stringify(body)}\n`);

        if (body.object === 'page') {

            for (const entry of body.entry) {
                if (entry.changes) {
                    for (const change of entry.changes) {
                        if (change.field === 'leadgen') {
                            const leadgenId = change.value.leadgen_id;
                            const pageId = change.value.page_id;
                            console.log(`New lead notification from Facebook: leadgen_id=${leadgenId}, page_id=${pageId}`);
                            
                            // Process lead asynchronously
                            processFacebookLead(leadgenId).catch(err => {
                                console.error('Error processing Facebook lead:', err);
                            });
                        }
                    }
                }
            }
            res.status(200).send('EVENT_RECEIVED');
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        console.error('Facebook Webhook POST error:', error);
        res.status(500).send('INTERNAL_ERROR');
    }
});

/**
 * Fetches lead details from Facebook Graph API and saves to database
 */
async function processFacebookLead(leadgenId) {
    try {
        const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
        if (!PAGE_ACCESS_TOKEN || PAGE_ACCESS_TOKEN === 'YOUR_PAGE_ACCESS_TOKEN_HERE') {
            console.error('FB_PAGE_ACCESS_TOKEN is not configured');
            return;
        }

        // 1. Fetch lead data from Facebook
        const response = await axios.get(`https://graph.facebook.com/v18.0/${leadgenId}?access_token=${PAGE_ACCESS_TOKEN}`);
        const leadData = response.data;
        
        console.log('Fetched lead data from FB:', JSON.stringify(leadData));

        // 2. Map Facebook fields to our Student model format
        // Lead Ads forms usually have standard field names or custom labels
        const fields = leadData.field_data || [];
        
        const getFieldValue = (name) => {
            const field = fields.find(f => f.name === name);
            return field ? field.values[0] : null;
        };

        // Standard Facebook lead field names: 'full_name', 'email', 'phone_number'
        const fullName = getFieldValue('full_name') || '';
        const email = getFieldValue('email') || '';
        const phone = getFieldValue('phone_number') || '';
        
        // Split name into First and Last
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || 'FB Lead';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : leadgenId;

        // 3. Prepare student object for database
        const studentObj = {
            Student_ID: 0, // New student
            First_Name: firstName,
            Last_Name: lastName,
            Email: email,
            Phone_Number: phone,
            Remark: `Lead from Facebook Ads (ID: ${leadgenId})`,
            Enquiry_Source_Id: 3, // ID 3 is "Facebook" in your database
            Created_By: 1, // System user ID
            Active_Status: 'Active',
            Delete_Status: 0,
            Branch_Id: null,
            Assigned_Staff_ID: null
        };

        // Log the mapped object for debugging
        fs.appendFileSync(path.join(__dirname, '../facebook_debug.log'), `[${new Date().toISOString()}] Saving Lead: ${JSON.stringify(studentObj)}\n`);

        console.log('Saving Facebook lead to database:', studentObj);

        // 4. Save to database using existing model
        const result = await studentModel.Save_student(studentObj);
        fs.appendFileSync(path.join(__dirname, '../facebook_debug.log'), `[${new Date().toISOString()}] DB Success: ${JSON.stringify(result)}\n`);
        console.log('Facebook lead saved successfully. DB Result:', result);


    } catch (error) {
        console.error(`Failed to process Facebook lead ${leadgenId}:`, error.response?.data || error.message);
        throw error;
    }
}


module.exports = router;
