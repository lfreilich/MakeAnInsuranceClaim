import type { Claim } from "@shared/schema";

// IntelliSMS API configuration
const INTELLISMS_API_URL = "https://mc5.smartmessagingservices.net/services/rest/message/sendSingle2";
const INTELLISMS_USERNAME = process.env.INTELLISMS_USERNAME;
const INTELLISMS_PASSWORD = process.env.INTELLISMS_PASSWORD;
const INTELLISMS_SENDER_ID = process.env.INTELLISMS_SENDER_ID || "MorelandEstate";

// Staff notification email
const STAFF_EMAIL = "claims@morelandestate.co.uk";

// Lazy-load Resend connector client
let resendClient: any = null;
let resendClientPromise: Promise<any> | null = null;

async function getResendClient() {
  if (resendClient) return resendClient;
  if (!resendClientPromise) {
    resendClientPromise = (async () => {
      try {
        const connectorHostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
        if (connectorHostname) {
          const module = await import(`http://${connectorHostname}/http-client.mjs`);
          resendClient = module.default;
          return resendClient;
        }
      } catch (error) {
        console.warn("Resend connector not available, email notifications will be skipped");
      }
      return null;
    })();
  }
  return resendClientPromise;
}

interface SMSResult {
  success: boolean;
  documentId?: string;
  messageStatus?: number;
  error?: string;
}

/**
 * Send an SMS using IntelliSMS API
 */
async function sendSMS(recipient: string, message: string): Promise<SMSResult> {
  if (!INTELLISMS_USERNAME || !INTELLISMS_PASSWORD) {
    console.error("IntelliSMS credentials not configured");
    return { success: false, error: "SMS credentials not configured" };
  }

  // Clean phone number - remove spaces, dashes, and plus sign
  let cleanRecipient = recipient.replace(/[\s\-\+]/g, '');
  
  // Convert to international format if it's a UK number with leading 0
  // Only convert if it starts with 0 and is 10-11 digits (UK format)
  if (cleanRecipient.startsWith('0') && /^0\d{9,10}$/.test(cleanRecipient)) {
    cleanRecipient = '44' + cleanRecipient.substring(1);
  }
  // If it doesn't start with a country code and isn't a UK 0-prefixed number, assume it's already international
  // Otherwise leave it as-is

  try {
    const params = new URLSearchParams({
      username: INTELLISMS_USERNAME,
      password: INTELLISMS_PASSWORD,
      recipient: cleanRecipient,
      sender: INTELLISMS_SENDER_ID,
      text: message,
      replyTo: 'log',
      encoding: 'gsm',
    });

    // IntelliSMS API returns JSON for REST endpoint
    const response = await fetch(`${INTELLISMS_API_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`IntelliSMS API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Parse response as JSON
    const result = await response.json();
    
    // Check if message was submitted successfully (status 10 means accepted)
    if (result.messageStatus && result.messageStatus !== 10) {
      console.warn(`IntelliSMS message status: ${result.messageStatus}`);
    }
    
    return {
      success: true,
      documentId: result.documentId,
      messageStatus: result.messageStatus,
    };
  } catch (error: any) {
    console.error("Failed to send SMS:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a verification code via SMS
 */
export async function sendVerificationCodeSMS(phone: string, code: string): Promise<SMSResult> {
  const message = `Your Moreland Estate verification code is: ${code}. This code expires in 10 minutes.`;
  return await sendSMS(phone, message);
}

/**
 * Send an email using Resend
 */
async function sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
  const client = await getResendClient();
  if (!client) {
    console.warn("Resend client not available, skipping email");
    return false;
  }

  try {
    await client.emails.send({
      from: "Moreland Estate <claims@morelandestate.co.uk>",
      to: [to],
      subject: subject,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

/**
 * Notify about a new claim submission
 */
export async function notifyClaimCreated(claim: Claim): Promise<void> {
  const emailSubject = `New Claim Submitted - ${claim.referenceNumber}`;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">New Insurance Claim Submitted</h2>
      
      <p>A new insurance claim has been submitted with the following details:</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Reference Number:</strong> ${claim.referenceNumber}</p>
        <p><strong>Claimant:</strong> ${claim.claimantName}</p>
        <p><strong>Email:</strong> ${claim.claimantEmail}</p>
        <p><strong>Phone:</strong> ${claim.claimantPhone}</p>
        <p><strong>Property:</strong> ${claim.propertyAddress}</p>
        <p><strong>Incident Type:</strong> ${claim.incidentType}</p>
        <p><strong>Incident Date:</strong> ${new Date(claim.incidentDate).toLocaleDateString('en-GB')}</p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">
        Please review the claim in the admin portal.
      </p>
    </div>
  `;

  // Send email to staff
  sendEmail(STAFF_EMAIL, emailSubject, emailBody).catch((error) => {
    console.error("Failed to send staff email notification:", error);
  });

  // Send SMS to staff (extract phone if available, or use a configured staff phone)
  const staffSMSMessage = `New claim submitted: ${claim.referenceNumber} from ${claim.claimantName} at ${claim.propertyAddress}. Incident: ${claim.incidentType}.`;
  
  // Note: You'll need to configure a staff phone number for SMS notifications
  // For now, we'll skip this unless configured
  const staffPhone = process.env.STAFF_NOTIFICATION_PHONE;
  if (staffPhone) {
    sendSMS(staffPhone, staffSMSMessage).catch((error) => {
      console.error("Failed to send staff SMS notification:", error);
    });
  }

  // Send SMS to claimant
  const claimantSMSMessage = `Your insurance claim ${claim.referenceNumber} has been submitted successfully. We will review it and contact you soon. - Moreland Estate`;
  
  sendSMS(claim.claimantPhone, claimantSMSMessage).catch((error) => {
    console.error("Failed to send claimant SMS notification:", error);
  });
}

/**
 * Notify about a claim update
 */
export async function notifyClaimUpdated(
  claim: Claim, 
  updateType: string,
  updateDetails?: string
): Promise<void> {
  const emailSubject = `Claim Updated - ${claim.referenceNumber}`;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Insurance Claim Updated</h2>
      
      <p>A claim has been updated:</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Reference Number:</strong> ${claim.referenceNumber}</p>
        <p><strong>Claimant:</strong> ${claim.claimantName}</p>
        <p><strong>Property:</strong> ${claim.propertyAddress}</p>
        <p><strong>Update Type:</strong> ${updateType}</p>
        ${updateDetails ? `<p><strong>Details:</strong> ${updateDetails}</p>` : ''}
        <p><strong>Current Status:</strong> ${claim.status}</p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">
        Please review the updated claim in the admin portal.
      </p>
    </div>
  `;

  // Send email to staff
  sendEmail(STAFF_EMAIL, emailSubject, emailBody).catch((error) => {
    console.error("Failed to send staff email notification:", error);
  });

  // Send SMS to staff
  const staffSMSMessage = `Claim ${claim.referenceNumber} updated: ${updateType}. ${updateDetails || ''}`;
  
  const staffPhone = process.env.STAFF_NOTIFICATION_PHONE;
  if (staffPhone) {
    sendSMS(staffPhone, staffSMSMessage).catch((error) => {
      console.error("Failed to send staff SMS notification:", error);
    });
  }

  // Send SMS to claimant
  const claimantSMSMessage = `Your claim ${claim.referenceNumber} has been updated: ${updateType}. Please check your email for details. - Moreland Estate`;
  
  sendSMS(claim.claimantPhone, claimantSMSMessage).catch((error) => {
    console.error("Failed to send claimant SMS notification:", error);
  });
}

/**
 * Notify about a claim status change
 */
export async function notifyClaimStatusChanged(
  claim: Claim,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  await notifyClaimUpdated(
    claim,
    'Status Change',
    `Changed from ${oldStatus} to ${newStatus}`
  );
}
