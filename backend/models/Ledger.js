const mongoose = require("mongoose");

const LedgerSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"], // credit: income/inflow, debit: expense/outflow
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ["Sales", "Purchase", "Expense", "Customer Payment", "Supplier Payment", "Others"],
      default: "Others",
    },
    paymentMethod: {
      type: String,
      required: true,
      default: "Cash",
    },
    partyName: {
      type: String,
      trim: true,
      default: "",
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    referenceType: {
      type: String,
      enum: ["Bill", "Supplier", "Customer", "Manual"],
      default: "Manual",
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    accountName: {
      type: String,
      default: "",
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

module.exports = {
  LedgerSchema,
  Ledger: mongoose.model("Ledger", LedgerSchema),
};
