function normalizeWhatsappPhone(rawPhone = "") {
  return String(rawPhone).replace(/^whatsapp:/, "").trim();
}

module.exports = {
  normalizeWhatsappPhone
};
