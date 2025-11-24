// Email service for sending claim notifications
import nodemailer from "nodemailer";
import type { Claim } from "@shared/schema";

// Email configuration
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@morelandestate.co.uk";
const CLAIMS_EMAIL = "claims@morelandestate.co.uk";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (!SMTP_USER || !SMTP_PASS) {
      console.warn("SMTP credentials not configured. Email sending is disabled.");
      // Return a test transporter for development
      transporter = nodemailer.createTransport({
        jsonTransport: true
      });
    } else {
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });
    }
  }
  return transporter;
}

export async function sendClaimConfirmationEmail(claim: Claim): Promise<void> {
  const transporter = getTransporter();

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
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: claim.claimantEmail,
      subject: `Claim Submitted - Reference: ${claim.referenceNumber}`,
      html: htmlContent,
    });

    // Send internal notification
    await transporter.sendMail({
      from: FROM_EMAIL,
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
