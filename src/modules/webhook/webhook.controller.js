const { processIncomingMessage } = require("../message/message.service");
const { logEvent } = require("../../utils/logger");

async function receiveWhatsappWebhook(req, res) {
  try {
    logEvent("MESSAGE_RECEIVED", {
      payload: req.body
    });

    await processIncomingMessage({
      from: req.body.From,
      body: req.body.Body,
      messageSid: req.body.MessageSid
    });

    return res.status(200).send("ok");
  } catch (error) {
    logEvent("WEBHOOK_PROCESSING_FAILED", {
      message: error.message,
      stack: error.stack || null
    });

    return res.status(200).send("ok");
  }
}

module.exports = {
  receiveWhatsappWebhook
};
