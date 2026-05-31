const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["Cash", "Bank", "UPI", "Other"],
      default: "Cash",
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    initialBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    businessType: {
      type: String,
      enum: ["agro", "pharma"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compounding unique index to prevent duplicate accounts of same name in the same business
AccountSchema.index({ name: 1, businessType: 1 }, { unique: true });

module.exports = {
  AccountSchema,
  Account: mongoose.model("Account", AccountSchema),
};
