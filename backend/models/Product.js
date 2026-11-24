const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema({
  batchNumber: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  quantity: { type: Number, default: 0 },
}, { timestamps: true });

const archivedBatchSchema = new mongoose.Schema({
  batchNumber: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  quantity: { type: Number, default: 0 },
  archivedAt: { type: Date, default: Date.now },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    businessType: { type: String, enum: ["agro", "pharma"], required: true, default: "agro" },
    category: { type: String },
    manufacturer: { type: String },
    quantity: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    ptr: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    hsn: { type: String, default: "" },
    barcode: { type: String, default: "" },
    
    // Pharma Specific
    batches: [batchSchema],
    archivedBatches: [archivedBatchSchema],
    returnReason: { type: String, default: "" },

    offers: [
      {
        buyQty: { type: Number, required: true },
        freeQty: { type: Number, required: true },
      }
    ],
  },
  { timestamps: true }
);

// Export schema for dynamic connection binding
module.exports = {
  productSchema,
  Product: mongoose.model("Product", productSchema) // Fallback for single-db usage
};
