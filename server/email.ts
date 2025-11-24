// Email service for sending claim notifications
import { Resend } from 'resend';
import type { Claim } from "@shared/schema";

const CLAIMS_EMAIL = "claims@morelandestate.co.uk";

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email};
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
async function getUncachableResendClient() {
  const credentials = await getCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: connectionSettings.settings.from_email || 'noreply@morelandestate.co.uk'
  };
}

export async function sendClaimConfirmationEmail(claim: Claim): Promise<void> {
  const { client: resend, fromEmail } = await getUncachableResendClient();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .reference { background: #dbeafe; padding: 15px; margin: 20px 0; border-left: 4px solid #1e40af; }
        .details { background: white; padding: 15px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Claim Submitted Successfully</h1>
        </div>
        <div class="content">
          <p>Dear ${claim.claimantName},</p>
          
          <p>Thank you for submitting your buildings insurance claim through Moreland Estate Management.</p>
          
          <div class="reference">
            <strong>Your Claim Reference Number:</strong><br>
            <h2 style="margin: 10px 0;">${claim.referenceNumber}</h2>
          </div>
          
          <p><strong>Please keep this reference number for all future correspondence.</strong></p>
          
          <div class="details">
            <h3>Claim Details:</h3>
            <p><strong>Property:</strong> ${claim.propertyAddress}</p>
            <p><strong>Incident Date:</strong> ${new Date(claim.incidentDate).toLocaleDateString()}</p>
            <p><strong>Incident Type:</strong> ${claim.incidentType.replace('_', ' ').toUpperCase()}</p>
            <p><strong>Submitted:</strong> ${new Date(claim.submittedAt!).toLocaleString()}</p>
          </div>
          
          <h3>What Happens Next:</h3>
          <ol>
            <li><strong>Review (1-2 business days):</strong> Moreland Estate Management will review your claim</li>
            <li><strong>Forward to Insurers:</strong> We will send your claim to the insurance company's claims team</li>
            <li><strong>Assessment (5-10 business days):</strong> The insurers will assess your claim and may contact you</li>
          </ol>
          
          <h3>Important Reminders:</h3>
          <ul>
            <li>Do not proceed with permanent repairs until the claim is approved</li>
            <li>Keep all receipts for any emergency repairs</li>
            <li>The insurers may arrange a property inspection</li>
          </ul>
          
          <p>If you have any questions, please contact us at <a href="mailto:${CLAIMS_EMAIL}">${CLAIMS_EMAIL}</a></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Moreland Estate Management<br>
          Buildings Insurance Claims Facilitation Service</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Send to claimant
    await resend.emails.send({
      from: fromEmail,
      to: claim.claimantEmail,
      subject: `Claim Submitted - Reference: ${claim.referenceNumber}`,
      html: htmlContent,
    });

    // Send internal notification
    await resend.emails.send({
      from: fromEmail,
      to: CLAIMS_EMAIL,
      subject: `New Claim Submitted - ${claim.referenceNumber}`,
      html: `
        <h2>New Insurance Claim Received</h2>
        <p><strong>Reference:</strong> ${claim.referenceNumber}</p>
        <p><strong>Claimant:</strong> ${claim.claimantName}</p>
        <p><strong>Email:</strong> ${claim.claimantEmail}</p>
        <p><strong>Phone:</strong> ${claim.claimantPhone}</p>
        <p><strong>Property:</strong> ${claim.propertyAddress}</p>
        <p><strong>Block:</strong> ${claim.propertyBlock}</p>
        <p><strong>Incident Date:</strong> ${new Date(claim.incidentDate).toLocaleDateString()}</p>
        <p><strong>Type:</strong> ${claim.incidentType}</p>
        <p><strong>Description:</strong></p>
        <p>${claim.incidentDescription}</p>
        <p><strong>Submitted:</strong> ${new Date(claim.submittedAt!).toLocaleString()}</p>
        <hr>
        <p>Please review and forward to the insurance company's claims team.</p>
      `,
    });

    console.log(`Claim confirmation email sent for ${claim.referenceNumber}`);
  } catch (error) {
    console.error("Email sending failed:", error);
    // Don't throw error - claim is still saved even if email fails
  }
}

export async function sendVerificationCodeEmail(email: string, code: string): Promise<void> {
  const { client: resend, fromEmail } = await getUncachableResendClient();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .code-box { background: #dbeafe; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
        .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af; }
        .warning { background: #fef3c7; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verification Code</h1>
        </div>
        <div class="content">
          <p>Someone requested access to the Moreland Estate Management Claims Portal using this email address.</p>
          
          <div class="code-box">
            <p style="margin: 0; font-size: 14px; color: #666;">Your verification code is:</p>
            <div class="code">${code}</div>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">This code expires in 10 minutes</p>
          </div>
          
          <p><strong>Enter this code to complete your login.</strong></p>
          
          <div class="warning">
            <strong>Security Note:</strong> If you did not request this code, please ignore this email. Your account remains secure.
          </div>
          
          <p>For assistance, contact us at <a href="mailto:${CLAIMS_EMAIL}">${CLAIMS_EMAIL}</a></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Moreland Estate Management<br>
          Buildings Insurance Claims Portal</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `Your Verification Code - Moreland Claims Portal`,
      html: htmlContent,
    });

    console.log(`Verification code email sent to ${email}`);
  } catch (error) {
    console.error("Verification email sending failed:", error);
    throw error; // Throw error so user knows verification failed
  }
}
