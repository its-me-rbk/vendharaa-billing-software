const mongoose = require("mongoose");

const ReturnBillSchema = new mongoose.Schema(
  {
    returnInvoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    originalBillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      required: true,
    },
    originalInvoiceNumber: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      default: "Walk-in Customer",
    },
    customerPhone: {
      type: String,
      default: "",
    },
    returnedItems: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        batchNumber: { type: String },
        expiryDate: { type: Date },
        qty: { type: Number, required: true, default: 0 },
        price: { type: Number, required: true, default: 0 },
        taxableAmount: { type: Number, default: 0 },
        gst: { type: Number, default: 0 },
        total: { type: Number, required: true, default: 0 },
        reason: {
          type: String,
          enum: ["Expired", "Near Expiry", "Defective", "Others"],
          required: true,
        },
      },
    ],
    replacementItems: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        batchNumber: { type: String },
        expiryDate: { type: Date },
        qty: { type: Number, required: true, default: 0 },
        price: { type: Number, required: true, default: 0 },
        taxableAmount: { type: Number, default: 0 },
        gst: { type: Number, default: 0 },
        total: { type: Number, required: true, default: 0 },
      },
    ],
    returnedAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    replacementAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    refundAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    extraCharged: {
      type: Number,
      required: true,
      default: 0,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: false,
    },
    accountName: {
      type: String,
      default: "",
    },
    businessType: {
      type: String,
      enum: ["pharma"],
      required: true,
      default: "pharma",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = {
  ReturnBillSchema,
  ReturnBill: mongoose.model("ReturnBill", ReturnBillSchema),
};
