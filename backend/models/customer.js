const mongoose= require("mongoose")

const CustomerSchema = new mongoose.Schema(
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
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    address: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    totalPurchase: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);


module.exports = {
  CustomerSchema,
  Customer: mongoose.model("Customer", CustomerSchema)
};