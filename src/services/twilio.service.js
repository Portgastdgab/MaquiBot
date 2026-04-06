const twilio = require("twilio");
const env = require("../config/env");
const logger = require("../config/logger");

const client = env.twilio.mockEnabled ? null : twilio(env.twilio.accountSid, env.twilio.authToken);

function buildMockSid() {
  const random = Math.random().toString(36).slice(2, 12).toUpperCase();
  return `SM_MOCK_${Date.now()}_${random}`;
}

async function sendWhatsappMessage(to, body) {
  if (env.twilio.mockEnabled) {
    const sid = buildMockSid();

    logger.info("WhatsApp message mocked", {
      sid,
      to,
      body
    });

    return {
      sid,
      to: `whatsapp:${to}`,
      from: env.twilio.whatsappNumber,
      body,
      mocked: true
    };
  }

  const response = await client.messages.create({
    from: env.twilio.whatsappNumber,
    to: `whatsapp:${to}`,
    body
  });

  logger.info("WhatsApp message sent", {
    sid: response.sid,
    to
  });

  return response;
}

module.exports = {
  sendWhatsappMessage
};
