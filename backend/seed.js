/**
 * Seed script for AgroMart Farm Billing Software
 * Run: node seed.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/usermodel");
const Product = require("./models/Product");
const Customer = require("./models/customer");
const Supplier = require("./models/Supplier");
const Bill = require("./models/Bill");
const GeneralSettings = require("./models/GeneralSettings_model");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // ─── CLEAR EXISTING DATA ──────────────────────────────────────────────────
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Customer.deleteMany({}),
    Supplier.deleteMany({}),
    Bill.deleteMany({}),
    GeneralSettings.deleteMany({}),
  ]);
  console.log("🗑  Cleared existing data");

  // ─── GENERAL SETTINGS ─────────────────────────────────────────────────────
  await GeneralSettings.create({
    pharmacyName: "Vendharaa Agro Store",
    licenseNumber: "REG/TN/2024/0042",
    gstNumber: "33AAACV1234F1ZX",
    address: "No. 12, Main Bazaar Road, Dharmapuri, Tamil Nadu - 636701",
    phone: "+91 9876543210",
    email: "info@vendharaaagro.com",
    openingTime: "08:00",
    closingTime: "20:00",
    sessionTimeoutEnabled: true,
    sessionTimeoutMinutes: 60,
  });
  console.log("⚙️  General settings seeded");

  // ─── USERS ────────────────────────────────────────────────────────────────
  const adminPass = await bcrypt.hash("Admin@1234", 10);
  const cashierPass = await bcrypt.hash("Cashier@1234", 10);

  await User.insertMany([
    { name: "Admin User", email: "admin@vendharaa.com", password: adminPass, role: "admin" },
    { name: "Cashier Ravi", email: "cashier@vendharaa.com", password: cashierPass, role: "cashier" },
  ]);
  console.log("👤 Users seeded");

  // ─── PRODUCTS ─────────────────────────────────────────────────────────────
  const products = await Product.insertMany([
    { name: "Urea Fertilizer (50kg)", category: "Fertilizers", manufacturer: "IFFCO", quantity: 200, price: 280, gst: 5, hsn: "3102" },
    { name: "DAP Fertilizer (50kg)", category: "Fertilizers", manufacturer: "IFFCO", quantity: 150, price: 1350, gst: 5, hsn: "3105" },
    { name: "NPK 19-19-19 (1kg)", category: "Fertilizers", manufacturer: "Coromandel", quantity: 500, price: 85, gst: 5, hsn: "3105" },
    { name: "Paddy Seeds BR26 (5kg)", category: "Seeds", manufacturer: "Tamil Nadu Seeds", quantity: 300, price: 320, gst: 0, hsn: "1006" },
    { name: "Sunflower Seeds (1kg)", category: "Seeds", manufacturer: "Rasi Seeds", quantity: 250, price: 180, gst: 0, hsn: "1206" },
    { name: "Tomato Hybrid Seeds (50g)", category: "Seeds", manufacturer: "Syngenta", quantity: 400, price: 120, gst: 0, hsn: "1209" },
    { name: "Chlorpyrifos 20% EC (1L)", category: "Pesticides", manufacturer: "Bayer CropScience", quantity: 120, price: 340, gst: 12, hsn: "3808" },
    { name: "Mancozeb 75% WP (1kg)", category: "Pesticides", manufacturer: "UPL", quantity: 180, price: 220, gst: 12, hsn: "3808" },
    { name: "2,4-D Herbicide (1L)", category: "Herbicides", manufacturer: "Crystal", quantity: 90, price: 160, gst: 12, hsn: "3808" },
    { name: "Hand Sprayer 16L", category: "Tools & Equipment", manufacturer: "Aspee", quantity: 40, price: 1250, gst: 18, hsn: "8424" },
    { name: "Drip Irrigation Kit (1 acre)", category: "Irrigation", manufacturer: "Jain Irrigation", quantity: 25, price: 4800, gst: 18, hsn: "8424" },
    { name: "Cattle Feed Premium (30kg)", category: "Animal Feed", manufacturer: "Godrej Agrovet", quantity: 80, price: 750, gst: 5, hsn: "2309" },
    { name: "Micronutrient Mixture (1kg)", category: "Fertilizers", manufacturer: "Sauri Agri", quantity: 350, price: 95, gst: 5, hsn: "3105" },
    { name: "Weedicide Glyphosate (1L)", category: "Herbicides", manufacturer: "Monsanto", quantity: 110, price: 210, gst: 12, hsn: "3808" },
    { name: "Garden Hoe (Heavy Duty)", category: "Tools & Equipment", manufacturer: "Falcon", quantity: 60, price: 380, gst: 18, hsn: "8201" },
    { name: "Potash Fertilizer (50kg)", category: "Fertilizers", manufacturer: "IPL", quantity: 180, price: 850, gst: 5, hsn: "3104" },
    { name: "Neem Oil Pesticide (500ml)", category: "Pesticides", manufacturer: "T-Stanes", quantity: 150, price: 245, gst: 12, hsn: "3808" },
    { name: "Hybrid Maize Seeds (10kg)", category: "Seeds", manufacturer: "Pioneer", quantity: 200, price: 1450, gst: 0, hsn: "1005" },
    { name: "Electric Fencing Wire (500m)", category: "Tools & Equipment", manufacturer: "V-Guard", quantity: 30, price: 3200, gst: 18, hsn: "7313" },
    { name: "Soil Testing Kit (Digital)", category: "Tools & Equipment", manufacturer: "AgroStar", quantity: 15, price: 2100, gst: 18, hsn: "9027" },
    { name: "Organic Vermicompost (25kg)", category: "Fertilizers", manufacturer: "Green Agro", quantity: 100, price: 450, gst: 5, hsn: "3101" },
    { name: "Poultry Feed Starter (25kg)", category: "Animal Feed", manufacturer: "Suguna", quantity: 120, price: 1150, gst: 5, hsn: "2309" },
    { name: "Rotavator Blades (Set of 6)", category: "Tools & Equipment", manufacturer: "Shaktiman", quantity: 50, price: 1850, gst: 18, hsn: "8432" },
    { name: "Sprinkler Nozzle (Pro-Series)", category: "Irrigation", manufacturer: "Finolex", quantity: 200, price: 120, gst: 18, hsn: "8424" },
    { name: "Bio-Fertilizer Azospirillum (1kg)", category: "Fertilizers", manufacturer: "TNAU", quantity: 300, price: 85, gst: 5, hsn: "3101" },
    { name: "Growth Promoter G-Pro (500ml)", category: "Other", manufacturer: "Rallis India", quantity: 140, price: 420, gst: 12, hsn: "3808" },
    { name: "Mulching Sheet (400m)", category: "Crop Protection", manufacturer: "Supreme", quantity: 45, price: 2800, gst: 18, hsn: "3920" },
    { name: "Sticky Traps (Pack of 10)", category: "Crop Protection", manufacturer: "Agri-Care", quantity: 500, price: 150, gst: 12, hsn: "3808" },
    { name: "Sickle (Forged Steel)", category: "Tools & Equipment", manufacturer: "Tata Agrico", quantity: 100, price: 210, gst: 18, hsn: "8201" },
    { name: "Goat Feed Pellets (20kg)", category: "Animal Feed", manufacturer: "Kisan", quantity: 90, price: 680, gst: 5, hsn: "2309" },
  ]);
  console.log(`🌱 ${products.length} products seeded`);

  // ─── CUSTOMERS ────────────────────────────────────────────────────────────
  const customers = await Customer.insertMany([
    { name: "Murugan Farms", phone: "9876501001", email: "murugan@gmail.com", address: "Krishnagiri, TN" },
    { name: "Rajan Agricultural", phone: "9876501002", email: "rajan@agri.com", address: "Salem, TN" },
    { name: "Selvam Traders", phone: "9876501003", email: "", address: "Hosur, TN" },
    { name: "Venkat Agro Co.", phone: "9876501004", email: "venkat@agromarket.in", address: "Namakkal, TN" },
    { name: "Priya Seeds Shop", phone: "9876501005", email: "", address: "Erode, TN" },
  ]);
  console.log(`👨‍🌾 ${customers.length} customers seeded`);

  // ─── SUPPLIERS ────────────────────────────────────────────────────────────
  await Supplier.insertMany([
    { name: "IFFCO Distributors", phone: "9111222333", email: "iffco@dist.com", address: "Chennai, TN", productsSupplied: 8 },
    { name: "Bayer CropScience TN", phone: "9222333444", email: "bayer@tn.com", address: "Coimbatore, TN", productsSupplied: 5 },
    { name: "Jain Irrigation South", phone: "9333444555", email: "jain@south.com", address: "Madurai, TN", productsSupplied: 3 },
    { name: "Rasi Seeds Depot", phone: "9444555666", email: "rasi@seeds.com", address: "Dharmapuri, TN", productsSupplied: 6 },
  ]);

  console.log("🏭 Suppliers seeded");

  // ─── SAMPLE BILLS ─────────────────────────────────────────────────────────
  const now = new Date();
  const daysAgo = (d) => new Date(now - d * 86400000);

  const makeBill = (idx, customer, itemsList, discountPct, paymentMethod, paid, daysBack) => {
    const subtotal = itemsList.reduce((s, i) => s + i.price * i.qty, 0);
    const discountAmt = (subtotal * discountPct) / 100;
    const taxable = subtotal - discountAmt;
    const gstAmt = itemsList.reduce((s, i) => {
      const base = i.price * i.qty * (1 - discountPct / 100);
      return s + base * (i.gst / 100);
    }, 0);
    const total = taxable + gstAmt;
    const month = String((daysAgo(daysBack)).getMonth() + 1).padStart(2, "0");
    const year = String((daysAgo(daysBack)).getFullYear()).slice(-2);
    const invoice = `#${month}${year}${String(idx).padStart(4, "0")}`;
    const balance = paid ? 0 : total;
    return {
      invoice,
      customerId: customer._id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerEmail: customer.email || "",
      items: itemsList.map(i => ({
        _id: i.productId,
        name: i.name,
        price: i.price,
        qty: i.qty,
        freeQty: 0,
        gst: i.gst,
        taxableAmount: i.price * i.qty,
        cgst: (i.price * i.qty * i.gst / 100) / 2,
        sgst: (i.price * i.qty * i.gst / 100) / 2,
        hsn: i.hsn || "",
        category: i.category || "General",
      })),
      subtotal,
      discount: discountPct,
      gst: gstAmt,
      total,
      paymentMethod,
      payments: paid ? [{ amount: total, method: paymentMethod, date: daysAgo(daysBack) }] : [],
      balance,
      paid,
      status: paid ? "Paid" : "Unpaid",
      createdAt: daysAgo(daysBack),
    };
  };

  const p = (i) => ({ productId: products[i]._id, name: products[i].name, price: products[i].price, qty: 0, gst: products[i].gst, hsn: products[i].hsn, category: products[i].category });

  const bills = [
    makeBill(1, customers[0], [{ ...p(0), qty: 10 }, { ...p(2), qty: 20 }, { ...p(6), qty: 3 }], 2, "Cash", true, 25),
    makeBill(2, customers[1], [{ ...p(1), qty: 5 }, { ...p(3), qty: 15 }], 0, "UPI", true, 20),
    makeBill(3, customers[2], [{ ...p(7), qty: 8 }, { ...p(8), qty: 4 }, { ...p(9), qty: 1 }], 5, "Cash", true, 18),
    makeBill(4, customers[3], [{ ...p(10), qty: 2 }, { ...p(11), qty: 6 }], 0, "Bank Transfer", false, 15),
    makeBill(5, customers[0], [{ ...p(4), qty: 30 }, { ...p(5), qty: 50 }], 3, "Cash", true, 12),
    makeBill(6, customers[4], [{ ...p(12), qty: 25 }, { ...p(13), qty: 10 }], 0, "UPI", true, 8),
    makeBill(7, customers[1], [{ ...p(0), qty: 20 }, { ...p(1), qty: 8 }, { ...p(14), qty: 5 }], 2, "Cash", false, 5),
    makeBill(8, customers[2], [{ ...p(6), qty: 6 }, { ...p(7), qty: 12 }], 0, "Cash", true, 3),
    makeBill(9, customers[3], [{ ...p(3), qty: 40 }, { ...p(4), qty: 20 }, { ...p(9), qty: 3 }], 0, "UPI", true, 2),
    makeBill(10, customers[4], [{ ...p(10), qty: 1 }, { ...p(11), qty: 10 }, { ...p(2), qty: 30 }], 5, "Cash", true, 1),
  ];

  await Bill.insertMany(bills);
  console.log(`🧾 ${bills.length} sample bills seeded`);

  console.log("\n═══════════════════════════════════════════════");
  console.log("  ✅  SEED COMPLETE — LOGIN DETAILS");
  console.log("═══════════════════════════════════════════════");
  console.log("  Admin   → admin@vendharaa.com   / Admin@1234");
  console.log("  Cashier → cashier@vendharaa.com / Cashier@1234");
  console.log("═══════════════════════════════════════════════\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
