const sgMail = require('@sendgrid/mail');
const { getSecret } = require('../../config/gcp/gcpSecretManager');

let isInitialized = false;
  
async function initMailer() {
    if (isInitialized) return;

    const SENDGRID_API_KEY = await getSecret('SENDGRID_API_KEY-athletic-gym');

    sgMail.setApiKey(SENDGRID_API_KEY);

    isInitialized = true;
}

module.exports = {
    sgMail,
    initMailer
};