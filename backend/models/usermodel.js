




const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["superadmin", "admin", "cashier"],
      required: true,
    },

    businessType: {
      type: String,
      enum: ["agro", "pharma", "master"],
      required: true,
      default: "agro",
    },

    logo: {
      type: String,
    },

    // single active session
    activeToken: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
