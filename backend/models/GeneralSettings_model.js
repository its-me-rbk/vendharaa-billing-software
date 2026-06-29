const mongoose =require("mongoose");

const GeneralSettingsSchema = new mongoose.Schema(
  {
    businessType: { type: String, enum: ["agro", "pharma"], required: true, default: "agro" },
    pharmacyName: {
      type: String,
      required: true,
      trim: true,
    },
    licenseNumber: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    openingTime: {
      type: String, // HH:mm
    },
    closingTime: {
      type: String, // HH:mm
    },
    logo: {
      type: String,
    },
    sessionTimeoutEnabled: {
      type: Boolean,
      default: true,
    },
    sessionTimeoutMinutes: {
      type: Number,
      default: 30,
    },
    paperSize: {
      type: String,
      default: "a4",
    },
    showLogo: {
      type: Boolean,
      default: true,
    },
    printGST: {
      type: Boolean,
      default: true,
    },
    autoPrint: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = {
  GeneralSettingsSchema,
  GeneralSettings: mongoose.model("GeneralSettings", GeneralSettingsSchema)
};
