const { processIncomingMessage } = require("../src/modules/message/message.service");

function getArgMessages() {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.length === 0) {
    return [
      "Hola",
      "Soy Carlos",
      "Quiero informacion",
      "Me interesa agendar"
    ];
  }

  return rawArgs;
}

async function run() {
  const messages = getArgMessages();
  const phone = process.env.SIM_PHONE || "+51999999999";

  console.log("--- Chat simulation start ---");
  console.log(`phone: ${phone}`);
  console.log(`messages: ${messages.length}`);

  for (let i = 0; i < messages.length; i += 1) {
    const userMessage = messages[i];
    const messageSid = `SM_SIM_${Date.now()}_${i}`;

    const result = await processIncomingMessage({
      from: `whatsapp:${phone}`,
      body: userMessage,
      messageSid
    });

    console.log(`\nTurn ${i + 1}`);
    console.log(`User: ${userMessage}`);
    console.log(`Bot : ${result.reply || "(sin respuesta)"}`);
    console.log(`Action: ${result.lead ? result.lead.stage : "n/a"}`);
    console.log(`ConversationStage: ${result.lead ? result.lead.conversationStage : "n/a"}`);
    console.log(`StageAttempts: ${result.lead && typeof result.lead.stageAttempts === "number" ? result.lead.stageAttempts : "n/a"}`);
    console.log(`VehicleInterest: ${result.lead ? result.lead.vehicleInterest : "n/a"}`);
    console.log(`PurchaseTiming: ${result.lead ? result.lead.purchaseTiming : "n/a"}`);
    console.log(`HasInitialCapital: ${result.lead ? result.lead.hasInitialCapital : "n/a"}`);
    console.log(`City: ${result.lead ? result.lead.city : "n/a"}`);
    console.log(`Status: ${result.lead ? result.lead.status : "n/a"}`);
  }

  console.log("\n--- Chat simulation end ---");
}

run().catch((error) => {
  console.error("Chat simulation failed", {
    message: error.message,
    code: error.code || null
  });
  process.exit(1);
});
