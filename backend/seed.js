/**
 * Multi-Tenant Seed script for Vendharaa Billing Software
 * Realtime-style Indian data (Tamil Nadu focus) using @faker-js/faker
 * Run: node seed.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { fakerEN_IN: faker } = require("@faker-js/faker");

const { productSchema } = require("./models/Product");
const { CustomerSchema } = require("./models/customer");
const { supplierSchema } = require("./models/Supplier");
const { BillSchema } = require("./models/Bill");
const { GeneralSettingsSchema } = require("./models/GeneralSettings_model");
const User = require("./models/usermodel");

const TN_CITIES = ["Dharmapuri", "Salem", "Chennai", "Trichy", "Madurai", "Coimbatore", "Erode", "Hosur", "Vellore", "Namakkal"];

async function seed() {
  console.log("🚀 Starting Localized Indian Seed (Tamil Nadu focus)...");

  // 1. CONNECT TO DATABASES
  const masterConn = await mongoose.createConnection(process.env.MONGO_URI).asPromise();
  const agroConn = await mongoose.createConnection(process.env.MONGO_URI_AGRO).asPromise();
  const pharmaConn = await mongoose.createConnection(process.env.MONGO_URI_PHARMA).asPromise();

  console.log("✅ Connected to all Databases");

  // Models
  const MasterUser = masterConn.model("User", User.schema);
  const AgroProduct = agroConn.model("Product", productSchema);
  const AgroCustomer = agroConn.model("Customer", CustomerSchema);
  const AgroSupplier = agroConn.model("Supplier", supplierSchema);
  const AgroBill = agroConn.model("Bill", BillSchema);
  const AgroSettings = agroConn.model("GeneralSettings", GeneralSettingsSchema);

  const PharmaProduct = pharmaConn.model("Product", productSchema);
  const PharmaCustomer = pharmaConn.model("Customer", CustomerSchema);
  const PharmaSupplier = pharmaConn.model("Supplier", supplierSchema);
  const PharmaBill = pharmaConn.model("Bill", BillSchema);
  const PharmaSettings = pharmaConn.model("GeneralSettings", GeneralSettingsSchema);

  // ─── CLEAR DATA ──────────────────────────────────────────────────────────
  await MasterUser.deleteMany({});
  await AgroProduct.deleteMany({}); await AgroCustomer.deleteMany({}); await AgroSupplier.deleteMany({}); await AgroBill.deleteMany({}); await AgroSettings.deleteMany({});
  await PharmaProduct.deleteMany({}); await PharmaCustomer.deleteMany({}); await PharmaSupplier.deleteMany({}); await PharmaBill.deleteMany({}); await PharmaSettings.deleteMany({});
  console.log("🗑  Cleared all databases");

  // ─── SEED LOGINS & SETTINGS ───────────────────────────────────────────────
  const adminPass = await bcrypt.hash("Admin@1234", 10);
  const cashierPass = await bcrypt.hash("Cashier@1234", 10);
  const superPass = await bcrypt.hash("Super@1234", 10);
  await MasterUser.insertMany([
    { name: "Main Admin", email: "superadmin@vendharaa.com", password: superPass, role: "superadmin", businessType: "master" },
    { name: "Agro Admin", email: "agro_admin@vendharaa.com", password: adminPass, role: "admin", businessType: "agro" },
    { name: "Agro Cashier", email: "agro_cashier@vendharaa.com", password: cashierPass, role: "cashier", businessType: "agro" },
    { name: "Pharma Admin", email: "pharma_admin@vendharaa.com", password: adminPass, role: "admin", businessType: "pharma" },
    { name: "Pharma Cashier", email: "pharma_cashier@vendharaa.com", password: cashierPass, role: "cashier", businessType: "pharma" },
  ]);

  await AgroSettings.create({ 
    pharmacyName: "Vendharaa Agro Store", 
    licenseNumber: "AGRO/2024/001", 
    businessType: "agro", 
    phone: "+91 9876543210",
    address: "Gandhi Nagar, Dharmapuri, Tamil Nadu - 636701",
    bankName: "Ujjivan Small Finance Bank",
    branchName: "Krishnagiri",
    accountNumber: "1130120250000479",
    ifsc: "UJVN0001130"
  });
  await PharmaSettings.create({ 
    pharmacyName: "Vendharaa Pharma Care", 
    licenseNumber: "PHAR/2024/002", 
    businessType: "pharma", 
    phone: "+91 8877665544",
    address: "Medical College Road, Salem, Tamil Nadu - 636030",
    bankName: "Ujjivan Small Finance Bank",
    branchName: "Krishnagiri",
    accountNumber: "1130120250000479",
    ifsc: "UJVN0001130"
  });

  // ─── SEED AGRO DATA ──────────────────────────────────────────────────────
  console.log("🌱 Seeding Localized Agro Data...");
  
  const agroSuppliers = await AgroSupplier.insertMany(Array.from({ length: 12 }).map(() => ({
    name: faker.company.name() + " Agro Industries",
    phone: faker.helpers.fromRegExp(/[6-9][0-9]{9}/),
    email: faker.internet.email(),
    address: faker.helpers.arrayElement(TN_CITIES),
    businessType: "agro"
  })));

  const agroCustomers = await AgroCustomer.insertMany(Array.from({ length: 25 }).map(() => ({
    name: faker.person.fullName(),
    phone: faker.helpers.fromRegExp(/[6-9][0-9]{9}/),
    address: faker.helpers.arrayElement(TN_CITIES),
    businessType: "agro"
  })));

  const agroProductNames = ["Urea (IFFCO) 50kg", "DAP Fertilizer (SPIC)", "Potash (MOP)", "Zinc Sulphate 21%", "Paddy Seeds - CR100", "Tomato Seeds F1", "Maize Seeds (Pioneer)", "Neem Oil 1L", "NPK 19:19:19", "Cow Dung Manure (Organic)", "Bio Fertilizer Liquid", "Copper Oxychloride (Blue Copper)", "Glyphosate 41%", "Agri Tools Kit", "Backpack Sprayer 16L"];
  const agroProducts = await AgroProduct.insertMany(agroProductNames.map((name, i) => ({
    name, 
    category: i < 4 ? "Fertilizers" : i < 8 ? "Seeds" : "Chemicals",
    manufacturer: faker.company.name(),
    quantity: faker.number.int({ min: 50, max: 200 }),
    price: faker.number.int({ min: 150, max: 3500 }),
    gst: i % 2 === 0 ? 5 : 0,
    businessType: "agro",
    offers: i % 5 === 0 ? [{ buyQty: 10, freeQty: 1 }] : []
  })));

  // Seed 35 Agro Bills
  for (let i = 0; i < 35; i++) {
    const cust = faker.helpers.arrayElement(agroCustomers);
    const prod = faker.helpers.arrayElement(agroProducts);
    const qty = faker.number.int({ min: 1, max: 10 });
    const subtotal = prod.price * qty;
    const gstAmt = (subtotal * prod.gst) / 100;
    const total = subtotal + gstAmt;
    const status = faker.helpers.arrayElement(["Paid", "Partial", "Unpaid"]);

    await AgroBill.create({
      invoice: `AG/INV/${1000 + i}`,
      businessType: "agro",
      customerName: cust.name,
      customerPhone: cust.phone,
      items: [{
        _id: prod._id.toString(),
        name: prod.name,
        price: prod.price,
        qty,
        gst: prod.gst,
        taxableAmount: subtotal,
        cgst: gstAmt/2,
        sgst: gstAmt/2
      }],
      subtotal, gst: gstAmt, total,
      paid: status === "Paid",
      status,
      payments: status !== "Unpaid" ? [{ amount: status === "Paid" ? total : total/2, method: "Cash", date: faker.date.recent() }] : [],
      balance: status === "Paid" ? 0 : status === "Partial" ? total/2 : total,
      createdAt: faker.date.recent({ days: 30 })
    });
  }

  // ─── SEED PHARMA DATA ────────────────────────────────────────────────────
  console.log("💊 Seeding Localized Pharma Data...");

  const pharmaSuppliers = await PharmaSupplier.insertMany(Array.from({ length: 12 }).map(() => ({
    name: faker.company.name() + " Pharmaceuticals",
    phone: faker.helpers.fromRegExp(/[6-9][0-9]{9}/),
    email: faker.internet.email(),
    address: faker.helpers.arrayElement(TN_CITIES),
    businessType: "pharma"
  })));

  const pharmaCustomers = await PharmaCustomer.insertMany(Array.from({ length: 25 }).map(() => ({
    name: faker.person.fullName(),
    phone: faker.helpers.fromRegExp(/[6-9][0-9]{9}/),
    address: faker.helpers.arrayElement(TN_CITIES),
    businessType: "pharma"
  })));

  const pharmaProductNames = ["Paracetamol 500mg (Dolo)", "Amoxicillin 250mg", "Cough Syrup (Benadryl)", "Vitamin C Chewable (Limcee)", "Insulin Glargine (Lantus)", "Metformin 500mg", "Atorvastatin 10mg", "Amlodipine 5mg", "Azithromycin 500mg", "Pantoprazole 40mg (Pan-D)", "Cetirizine 10mg", "Ibuprofen 400mg (Combiflam)", "B-Complex Caps (Becosules)", "Zincovit Syrup", "ORS Powder Pkt (Electral)", "Face Mask N95", "Hand Sanitizer (Himalaya)", "Digital Thermometer", "Elastic Bandage", "Disinfectant Spray (Dettol)"];
  const pharmaProducts = await PharmaProduct.insertMany(pharmaProductNames.map((name, i) => ({
    name,
    category: i < 5 ? "Tablets" : i < 10 ? "Syrups" : "General",
    manufacturer: faker.company.name(),
    quantity: faker.number.int({ min: 100, max: 1000 }),
    price: faker.number.int({ min: 20, max: 1500 }),
    gst: faker.helpers.arrayElement([5, 12, 18]),
    businessType: "pharma",
    batches: [
      { batchNumber: faker.string.alphanumeric(6).toUpperCase(), expiryDate: faker.date.future({ years: 2 }), quantity: 300 },
      { batchNumber: faker.string.alphanumeric(6).toUpperCase(), expiryDate: faker.date.soon({ days: 60 }), quantity: 200 }
    ],
    offers: i % 5 === 0 ? [{ buyQty: 10, freeQty: 2 }] : []
  })));

  // Seed 35 Pharma Bills
  for (let i = 0; i < 35; i++) {
    const cust = faker.helpers.arrayElement(pharmaCustomers);
    const prod = faker.helpers.arrayElement(pharmaProducts);
    const qty = faker.number.int({ min: 1, max: 20 });
    const subtotal = prod.price * qty;
    const gstAmt = (subtotal * prod.gst) / 100;
    const total = subtotal + gstAmt;
    const status = faker.helpers.arrayElement(["Paid", "Partial", "Unpaid"]);

    await PharmaBill.create({
      invoice: `PH/INV/${2000 + i}`,
      businessType: "pharma",
      customerName: cust.name,
      customerPhone: cust.phone,
      items: [{
        _id: prod._id.toString(),
        name: prod.name,
        price: prod.price,
        qty,
        gst: prod.gst,
        taxableAmount: subtotal,
        cgst: gstAmt/2,
        sgst: gstAmt/2,
        batchNumber: prod.batches[0].batchNumber,
        expiryDate: prod.batches[0].expiryDate
      }],
      subtotal, gst: gstAmt, total,
      paid: status === "Paid",
      status,
      payments: status !== "Unpaid" ? [{ amount: status === "Paid" ? total : total/2, method: "UPI", date: faker.date.recent() }] : [],
      balance: status === "Paid" ? 0 : status === "Partial" ? total/2 : total,
      createdAt: faker.date.recent({ days: 30 })
    });
  }

  console.log("\n✅ LOCALIZED INDIAN SEED COMPLETE");
  console.log("---------------------------------------");
  console.log("Agro: 15 Products, 25 Customers, 12 Suppliers, 35 Bills");
  console.log("Pharma: 20 Products, 25 Customers, 12 Suppliers, 35 Bills");
  console.log("---------------------------------------\n");

  console.log("\n✅ SEEDING COMPLETE");
  console.log("---------------------------------------");
  console.log("Super Admin: superadmin@vendharaa.com / Super@1234");
  console.log("Admin Agro: agro_admin@vendharaa.com / Admin@1234");
  console.log("Admin Pharma: pharma_admin@vendharaa.com / Admin@1234");
  console.log("Cashier Agro: agro_cashier@vendharaa.com / Cashier@1234");
  console.log("Cashier Pharma: pharma_cashier@vendharaa.com / Cashier@1234");
  console.log("---------------------------------------\n");

  await masterConn.close(); await agroConn.close(); await pharmaConn.close();
}

seed().catch(err => { console.error("❌ Seed failed:", err); process.exit(1); });
