const { executeTransaction } = require('../helpers/sp-caller');

const email_template = {
    Save_Email_Template: async function (template) {
        return executeTransaction('Save_Email_Template', [
            template.Template_ID || 0,
            template.Template_Name,
            template.Subject,
            template.Body
        ]);
    },
    Get_Email_Template: async function (id) {
        return executeTransaction('Get_Email_Template', [id]);
    },
    Search_Email_Template: async function (searchTerm) {
        return executeTransaction('Search_Email_Template', [searchTerm || '']);
    },
    Delete_Email_Template: async function (id) {
        return executeTransaction('Delete_Email_Template', [id]);
    }
};

module.exports = email_template;
