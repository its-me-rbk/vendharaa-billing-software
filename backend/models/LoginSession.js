

const mongoose = require("mongoose");

const LoginSessionSchema = new mongoose.Schema(
  {
    businessType: { type: String, enum: ["agro", "pharma", "master"], required: true, default: "agro" },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["superadmin", "admin", "cashier"],
      required: true,
    },

    loginTime: {
      type: Date,
      required: true,
      default: Date.now,
    },

    logoutTime: {
      type: Date,
      default: null,
    },

    expiryTime: {
      type: Date,
      default: null,
    },

    logoutReason: {
      type: String,
      enum: ['manual','expired','replaced', null],
      default: null,
    },

    token: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = {
  LoginSessionSchema,
  LoginSession: mongoose.model("LoginSession", LoginSessionSchema)
};
