const mongoose = require("mongoose");

const ActivityLogSchema = new mongoose.Schema(
  {
    user: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
      role: { type: String, required: true },
    },
    action: {
      type: String, // e.g., "CREATE_PRODUCT", "DELETE_BILL", "LOGIN"
      required: true,
    },
    description: {
      type: String, // e.g., "User logged in", "Created product 'Aspirin'"
    },
    method: {
      type: String, // POST, PUT, DELETE
    },
    endpoint: {
      type: String,
    },
    businessType: {
      type: String, // agro, pharma, master
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // Storing what changed
    },
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", ActivityLogSchema);
