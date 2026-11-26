const mongoose = require("mongoose");

const connections = {
  master: null,
  agro: null,
  pharma: null
};

const connectDB = async () => {
  try {
    // 1. Connect to Master DB (Billing/Users)
    connections.master = await mongoose.createConnection(process.env.MONGO_URI).asPromise();
    console.log(`✅ Master DB Connected: ${connections.master.name}`);

    // 2. Connect to Agro DB
    if (process.env.MONGO_URI_AGRO) {
      connections.agro = await mongoose.createConnection(process.env.MONGO_URI_AGRO).asPromise();
      console.log(`✅ Agro DB Connected: ${connections.agro.name}`);
    }

    // 3. Connect to Pharma DB
    if (process.env.MONGO_URI_PHARMA) {
      connections.pharma = await mongoose.createConnection(process.env.MONGO_URI_PHARMA).asPromise();
      console.log(`✅ Pharma DB Connected: ${connections.pharma.name}`);
    }

    // Connect default mongoose for standard use cases (legacy or single-db fallback)
    await mongoose.connect(process.env.MONGO_URI);

  } catch (error) {
    console.error(`❌ Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const getConnection = (type) => {
  if (type === 'pharma') return connections.pharma;
  if (type === 'agro') return connections.agro;
  return connections.master;
};

const getModels = (connection) => {
  if (!connection) return null;
  
  // Schemas
  const { productSchema } = require("../models/Product");
  const { BillSchema } = require("../models/Bill");
  const { CustomerSchema } = require("../models/customer");
  const { supplierSchema } = require("../models/Supplier");
  const { GeneralSettingsSchema } = require("../models/GeneralSettings_model");
  const { LoginSessionSchema } = require("../models/LoginSession");
  const { LedgerSchema } = require("../models/Ledger");
  const { AccountSchema } = require("../models/Account");
  const { ReturnBillSchema } = require("../models/ReturnBill");
  const { StockTransactionSchema } = require("../models/StockTransaction");

  return {
    Product: connection.model("Product", productSchema),
    Bill: connection.model("Bill", BillSchema),
    Customer: connection.model("Customer", CustomerSchema),
    Supplier: connection.model("Supplier", supplierSchema),
    GeneralSettings: connection.model("GeneralSettings", GeneralSettingsSchema),
    LoginSession: connection.model("LoginSession", LoginSessionSchema),
    Ledger: connection.model("Ledger", LedgerSchema),
    Account: connection.model("Account", AccountSchema),
    ReturnBill: connection.model("ReturnBill", ReturnBillSchema),
    StockTransaction: connection.model("StockTransaction", StockTransactionSchema),
  };
};

module.exports = { connectDB, getConnection, connections, getModels };
