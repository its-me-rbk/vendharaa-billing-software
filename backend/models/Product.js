const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    category: { type: String },
    manufacturer: { type: String },
    quantity: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    hsn: { type: String, default: "" },
    barcode: { type: String, default: "" },
    offers: [
      {
        buyQty: { type: Number, required: true },
        freeQty: { type: Number, required: true },
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
