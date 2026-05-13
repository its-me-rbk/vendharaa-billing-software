const cron = require("node-cron");
const { connections, getModels } = require("../config/db");

/**
 * Task: Move expired or zero-quantity batches to archivedBatches
 * Runs every day at midnight
 */
const startCronJobs = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ Running Daily Batch Archiving Job...");
    
    // Only Pharma needs this
    const pharmaDb = connections.pharma;
    if (!pharmaDb) return;

    const models = getModels(pharmaDb);
    const { Product } = models;

    try {
      const products = await Product.find({ "batches.0": { $exists: true } });
      const today = new Date();

      for (let product of products) {
        let changed = false;
        const activeBatches = [];
        const archivedBatches = product.archivedBatches || [];

        for (let batch of product.batches) {
          const isExpired = batch.expiryDate && new Date(batch.expiryDate) < today;
          const isEmpty = batch.quantity <= 0;

          if (isExpired || isEmpty) {
            archivedBatches.push({
              batchNumber: batch.batchNumber,
              expiryDate: batch.expiryDate,
              quantity: batch.quantity,
              archivedAt: new Date(),
            });
            changed = true;
          } else {
            activeBatches.push(batch);
          }
        }

        if (changed) {
          product.batches = activeBatches;
          product.archivedBatches = archivedBatches;
          await product.save();
          console.log(`📦 Archived batches for product: ${product.name}`);
        }
      }
    } catch (err) {
      console.error("❌ Cron Job Error:", err);
    }
  });
};

module.exports = startCronJobs;
