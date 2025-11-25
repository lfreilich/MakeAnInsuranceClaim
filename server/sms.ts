// SMS service for sending verification codes via Intellisms
// Using Intellisms HTTP API: https://www.intellisms.co.uk/sms-gateway/http-interface/

export async function sendVerificationCodeSMS(toPhone: string, code: string): Promise<void> {
  const username = process.env.INTELLISMS_USERNAME;
  const password = process.env.INTELLISMS_PASSWORD;
  const senderId = process.env.INTELLISMS_SENDER_ID || 'Moreland';

  if (!username || !password) {
    throw new Error('Intellisms credentials not configured');
  }

  // Format phone number - remove any non-digit characters except leading +
  let formattedPhone = toPhone.replace(/[^\d+]/g, '');
  // If starts with +, remove it (Intellisms expects numbers without +)
  if (formattedPhone.startsWith('+')) {
    formattedPhone = formattedPhone.substring(1);
  }
  // If starts with 0, replace with 44 for UK
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '44' + formattedPhone.substring(1);
  }

  const message = `Your Moreland Claims Portal verification code is: ${code}. This code expires in 10 minutes.`;

  try {
    // Using Form Post method for Intellisms
    const params = new URLSearchParams({
      username: username,
      password: password,
      to: formattedPhone,
      from: senderId,
      text: message,
    });

    const response = await fetch('https://www.intellisoftware.co.uk/smsgateway/sendmsg.aspx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const responseText = await response.text();
    console.log(`Intellisms response: ${responseText}`);

    // Check for error responses
    // Intellisms returns "ID:<message_id>" on success or "ERR:<error_code>" on failure
    if (responseText.startsWith('ERR:')) {
      const errorCode = responseText.substring(4);
      throw new Error(`Intellisms error: ${getIntellismsErrorMessage(errorCode)}`);
    }

    console.log(`Verification SMS sent to ${formattedPhone} via Intellisms`);
  } catch (error) {
    console.error("SMS sending failed:", error);
    throw error;
  }
}

function getIntellismsErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    '1': 'No username specified',
    '2': 'No password specified',
    '3': 'No destination specified', 
    '4': 'No message specified',
    '5': 'Too many recipients',
    '6': 'Invalid username or password',
    '7': 'Insufficient credits',
    '8': 'Gateway error',
    '9': 'Invalid schedule date',
    '10': 'Internal error',
  };
  return errorMessages[errorCode] || `Unknown error (${errorCode})`;
}
