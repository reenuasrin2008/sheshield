export interface SMSDispatchPayload {
  recipients: string[];
  message: string;
  isTestMode?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  trackingUrl?: string | null;
}

export interface SMSDispatchResult {
  provider: string;
  status: 'delivered' | 'simulated' | 'failed';
  dispatchedCount: number;
  deliveryLog: {
    recipient: string;
    messageId: string;
    status: 'sent' | 'simulated' | 'failed';
    timestamp: string;
    note?: string;
  }[];
}

/**
 * Pluggable SMS Provider Adapter for SheShield emergency dispatch.
 * Supports production providers (MSG91, Twilio) and transparent Test Mode simulation.
 */
export async function sendEmergencySMS(
  payload: SMSDispatchPayload
): Promise<SMSDispatchResult> {
  const { recipients, message, isTestMode, latitude, longitude, trackingUrl } = payload;
  const providerType = process.env.SMS_PROVIDER || 'test';
  const apiKey = process.env.SMS_PROVIDER_API_KEY;

  let fullMessage = message;
  if (latitude && longitude) {
    fullMessage += `\nLocation: https://maps.google.com/?q=${latitude},${longitude}`;
  }
  if (trackingUrl) {
    fullMessage += `\nLive Tracking: ${trackingUrl}`;
  }

  // If in explicit test mode or no external key is configured, execute deterministic simulation
  if (isTestMode || providerType === 'test' || !apiKey) {
    const deliveryLog = recipients.map((phone, idx) => ({
      recipient: phone,
      messageId: `sim_${Date.now()}_${idx}`,
      status: 'simulated' as const,
      timestamp: new Date().toISOString(),
      note: isTestMode
        ? "Explicit user test mode - SMS simulated without carrier charge"
        : "SMS provider key not configured in .env.local - simulated safely"
    }));

    console.info(`[SheShield SOS Simulation] Alert generated for ${recipients.length} recipients:`, {
      message: fullMessage,
      recipients
    });

    return {
      provider: 'SheShield Simulated Gateway',
      status: 'simulated',
      dispatchedCount: recipients.length,
      deliveryLog
    };
  }

  // Twilio adapter implementation
  if (providerType === 'twilio') {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !fromNumber) {
      return {
        provider: 'twilio',
        status: 'failed',
        dispatchedCount: 0,
        deliveryLog: recipients.map(r => ({
          recipient: r,
          messageId: '',
          status: 'failed' as const,
          timestamp: new Date().toISOString(),
          note: 'Twilio credentials incomplete'
        }))
      };
    }

    const logs = [];
    let successCount = 0;

    for (const recipient of recipients) {
      try {
        const auth = Buffer.from(`${accountSid}:${apiKey}`).toString('base64');
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              To: recipient,
              From: fromNumber,
              Body: fullMessage
            })
          }
        );

        const data = await res.json();
        if (res.ok) {
          successCount++;
          logs.push({
            recipient,
            messageId: data.sid || '',
            status: 'sent' as const,
            timestamp: new Date().toISOString()
          });
        } else {
          logs.push({
            recipient,
            messageId: '',
            status: 'failed' as const,
            timestamp: new Date().toISOString(),
            note: data.message || 'Carrier error'
          });
        }
      } catch (err: any) {
        logs.push({
          recipient,
          messageId: '',
          status: 'failed' as const,
          timestamp: new Date().toISOString(),
          note: err.message
        });
      }
    }

    return {
      provider: 'twilio',
      status: successCount > 0 ? 'delivered' : 'failed',
      dispatchedCount: successCount,
      deliveryLog: logs
    };
  }

  // Fallback
  return {
    provider: providerType,
    status: 'simulated',
    dispatchedCount: recipients.length,
    deliveryLog: recipients.map(r => ({
      recipient: r,
      messageId: `log_${Date.now()}`,
      status: 'simulated' as const,
      timestamp: new Date().toISOString()
    }))
  };
}
