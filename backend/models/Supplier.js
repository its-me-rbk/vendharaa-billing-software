const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    businessType: { type: String, enum: ["agro", "pharma"], required: true, default: "agro" },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    address: {
      type: String,
      trim: true,
    },

    productsSupplied: {
      type: Number,
      default: 0,
      min: 0,
    },

    initialDue: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = {
  supplierSchema,
  Supplier: mongoose.model("Supplier", supplierSchema)
};
