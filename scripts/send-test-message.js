const { sendWhatsappMessage } = require("../src/services/twilio.service");
const logger = require("../src/config/logger");

function toWhatsappAddress(input = "") {
  const value = String(input).trim();
  if (!value) {
    return "";
  }

  return value.startsWith("whatsapp:") ? value.replace("whatsapp:", "") : value;
}

async function main() {
  const to = toWhatsappAddress(process.argv[2]);
  const body = process.argv[3] || "Mensaje de prueba desde MaquiBot";

  if (!to) {
    console.error("Usage: npm run twilio:test -- <phone> [message]");
    process.exit(1);
  }

  const result = await sendWhatsappMessage(to, body);

  logger.info("Manual Twilio test sent", {
    sid: result.sid,
    to,
    status: result.status || "queued"
  });
}

main().catch((error) => {
  logger.error("Manual Twilio test failed", {
    message: error.message,
    code: error.code,
    status: error.status
  });
  process.exit(1);
});
