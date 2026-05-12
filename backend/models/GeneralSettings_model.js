const mongoose =require("mongoose");

const GeneralSettingsSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("GeneralSettings", GeneralSettingsSchema);
