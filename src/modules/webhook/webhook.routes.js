const express = require("express");
const { receiveWhatsappWebhook } = require("./webhook.controller");

const router = express.Router();

router.post("/whatsapp", receiveWhatsappWebhook);

module.exports = router;
