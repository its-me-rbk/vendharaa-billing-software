
const mongoose = require("mongoose");

const BillSchema = new mongoose.Schema({
  invoice: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  customerName: { type: String, default: "No Name" },
  customerAddress: { type: String, default: "" },
  customerPhone: { type: String, default: "" },
  customerEmail: { type: String, default: "" },

  items: [
    {
      _id: { type: String, required: true }, // product id
      name: String,
      batchNumber: String,  // REQUIRED for batch deduction
      price: Number,
      qty: Number,
      freeQty: { type: Number, default: 0 },
      gst: Number,
      taxableAmount: Number,
      sgst: Number,
      cgst: Number,
      category: String,
      hsn: String,
    }
  ],

  subtotal: Number,
  discount: Number,
  gst: Number,
  total: Number,

  // Payment tracking for split/partial payments
  paymentMethod: { type: String, default: "Cash" },
  payments: [
    {
      amount: { type: Number, required: true },
      method: { type: String, default: "Cash" },
      date: { type: Date, default: Date.now }
    }
  ],
  balance: { type: Number, default: 0 }, // remaining amount to be paid
  paid: { type: Boolean, default: false },
  status: { type: String, enum: ["Unpaid", "Partial", "Paid"], default: "Unpaid" },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Bill", BillSchema);



