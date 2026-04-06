const db = require("../src/config/firestore");
const logger = require("../src/config/logger");

async function run() {
  const now = new Date().toISOString();
  const testId = `smoke_${Date.now()}`;
  const payload = {
    source: "firestore-smoke-test",
    message: "Firestore write/read validation",
    createdAt: now
  };

  const docRef = db.collection("healthchecks").doc(testId);
  await docRef.set(payload);

  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error("Smoke test document was not found after write");
  }

  const data = snapshot.data();
  logger.info("Firestore smoke test passed", {
    id: testId,
    collection: "healthchecks",
    createdAt: data.createdAt
  });

  // Clean test data to keep Firestore tidy.
  await docRef.delete();

  logger.info("Firestore smoke test cleanup done", {
    id: testId
  });
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error("Firestore smoke test failed", {
      message: error.message,
      code: error.code || null
    });
    process.exit(1);
  });
