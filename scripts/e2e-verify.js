const db = require("../src/config/firestore");
const { MESSAGE_DIRECTIONS } = require("../src/modules/message/message.repository");

async function run() {
  const phone = process.argv[2];

  if (!phone) {
    console.error("Usage: npm run e2e:verify -- <phone>");
    process.exit(1);
  }

  const leadSnap = await db.collection("leads").doc(phone).get();
  const lead = leadSnap.exists ? leadSnap.data() : null;

  const msgsSnap = await db.collection("messages").where("leadPhone", "==", phone).get();

  let inbound = 0;
  let outbound = 0;
  let lastInbound = null;
  let lastOutbound = null;

  msgsSnap.forEach((doc) => {
    const msg = doc.data();
    if (msg.direction === MESSAGE_DIRECTIONS.INBOUND) {
      inbound += 1;
      if (!lastInbound || msg.createdAt > lastInbound.createdAt) {
        lastInbound = msg;
      }
      return;
    }

    if (msg.direction === MESSAGE_DIRECTIONS.OUTBOUND) {
      outbound += 1;
      if (!lastOutbound || msg.createdAt > lastOutbound.createdAt) {
        lastOutbound = msg;
      }
    }
  });

  const result = {
    phone,
    checks: {
      webhookSavedInboundMessage: inbound > 0,
      firestoreHasLead: Boolean(lead),
      systemRespondedOutbound: outbound > 0,
      basicFlowWorking: Boolean(lead && inbound > 0 && outbound > 0)
    },
    lead: lead
      ? {
          status: lead.status,
          stage: lead.stage,
          name: lead.name || null,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt
        }
      : null,
    counters: {
      inbound,
      outbound
    },
    lastInbound,
    lastOutbound
  };

  console.log(JSON.stringify(result, null, 2));
}

run().catch((error) => {
  console.error("E2E verify failed", {
    message: error.message,
    code: error.code || null
  });
  process.exit(1);
});
