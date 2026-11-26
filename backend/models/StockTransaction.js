const mongoose = require("mongoose");

const StockTransactionSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, default: "" },
    manufacturer: { type: String, default: "" },
    type: { type: String, enum: ["initial", "purchase", "adjustment"], default: "purchase" },
    quantity: { type: Number, required: true, default: 0 },
    batchNumber: { type: String, default: "" },
    businessType: { type: String, enum: ["agro", "pharma"], default: "agro" },
  },
  { timestamps: true }
);

module.exports = {
  StockTransactionSchema,
  StockTransaction: mongoose.model("StockTransaction", StockTransactionSchema),
};
