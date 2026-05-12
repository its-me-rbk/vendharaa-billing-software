
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const Bill = require("../models/Bill");
const Product = require("../models/Product");
const Customer = require("../models/customer");

// Helper: recalculate customer's totalPurchase and loyaltyPoints from bills
async function recalcCustomerTotals(customerId) {
  if (!customerId) return;
  try {
    const cust = await Customer.findById(customerId).exec();
    const orConditions = [{ customerId: customerId }];
    if (cust && cust.phone) {
      orConditions.push({ customerPhone: String(cust.phone) });
    }

    const bills = await Bill.find({ $or: orConditions });
    const total = bills.reduce((s, b) => s + (Number(b.total) || 0), 0);
    const points = bills.reduce((s, b) => s + Math.floor((Number(b.total) || 0) / 1000), 0);
    await Customer.findByIdAndUpdate(customerId, { totalPurchase: total, loyaltyPoints: points });
  } catch (err) {
    console.error("Failed to recalc customer totals for", customerId, err);
  }
}

// CREATE BILL + DEDUCT STOCK (wholesale: direct quantity deduction)
router.post("/", auth, async (req, res, next) => {
  try {
    const { items } = req.body;

    for (let item of items) {
      const product = await Product.findOne({ name: item.name });
      if (!product) continue;

      if (product.quantity < item.qty) {
        return res.status(400).json({
          error: `Not enough stock for ${item.name}. Available: ${product.quantity}`,
        });
      }

      const totalToDeduct = (Number(item.qty) || 0) + (Number(item.freeQty) || 0);
      product.quantity -= totalToDeduct;
      await product.save();
    }

    // Attach category to each item
    const { items: incomingItems } = req.body;
    const itemsWithCategory = [];

    for (let item of incomingItems) {
      const p = await Product.findOne({ name: item.name });
      itemsWithCategory.push({
        ...item,
        category: p ? p.category : "General",
        hsn: item.hsn || (p ? p.hsn : ""),
      });
    }

    const incoming = { ...req.body, items: itemsWithCategory };
    const totalAmount = Number(incoming.total) || 0;

    let payments = Array.isArray(incoming.payments)
      ? incoming.payments.map((p) => ({
          amount: Number(p.amount) || 0,
          method: p.method || incoming.paymentMethod || "Cash",
          date: p.date || Date.now(),
        }))
      : [];

    if ((incoming.paid === true || incoming.paid === "true") && payments.length === 0) {
      payments = [{ amount: totalAmount, method: incoming.paymentMethod || "Cash", date: Date.now() }];
    }

    const paidSum = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const balance = Math.max(0, totalAmount - paidSum);
    const paidFlag = balance === 0 && totalAmount > 0;
    const status = paidFlag ? "Paid" : paidSum > 0 ? "Partial" : "Unpaid";

    incoming.payments = payments;
    incoming.balance = balance;
    incoming.paid = paidFlag;
    incoming.status = status;

    const bill = await Bill.create(incoming);

    try {
      const customerId = req.body.customerId || req.body.customer_id || null;
      if (customerId) await recalcCustomerTotals(customerId);
    } catch (err) {
      console.error("Failed to recalc customer totalPurchase after bill create:", err);
    }

    res.json({ success: true, bill });
  } catch (err) {
    next(err);
  }
});

// GET DUE BILLS (partial or unpaid)
router.get("/due", auth, async (req, res) => {
  try {
    const bills = await Bill.find({
      $or: [{ paid: false }, { status: "Partial" }, { balance: { $gt: 0 } }],
    }).sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch due bills" });
  }
});

// ADD PAYMENT TO A BILL
router.post("/:id/payments", auth, async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ error: "Bill not found" });

    const amount = Number(req.body.amount) || 0;
    const method = req.body.method || bill.paymentMethod || "Cash";
    if (amount <= 0) return res.status(400).json({ error: "Invalid payment amount" });

    bill.payments = bill.payments || [];
    bill.payments.push({ amount, method, date: req.body.date || Date.now() });

    const paidSum = bill.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    bill.balance = Math.max(0, (Number(bill.total) || 0) - paidSum);
    bill.paid = bill.balance === 0 && (Number(bill.total) || 0) > 0;
    bill.status = bill.paid ? "Paid" : paidSum > 0 ? "Partial" : "Unpaid";

    await bill.save();

    try {
      if (bill.paid && bill.customerId) await recalcCustomerTotals(bill.customerId);
    } catch (err) {
      console.error("Failed to recalc customer totals after payment:", err);
    }

    res.json({ success: true, bill });
  } catch (err) {
    next(err);
  }
});

// GET ALL BILLS
router.get("/", auth, async (req, res, next) => {
  try {
    const bills = await Bill.find().sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    next(err);
  }
});

// GET SINGLE BILL
router.get("/:id", auth, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    res.json(bill);
  } catch {
    res.status(500).json({ error: "Bill not found" });
  }
});

// DELETE BILL + RESTORE STOCK
router.delete("/:id", auth, async (req, res, next) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });

    // Restore stock directly on product.quantity (wholesale — no batches)
    for (let item of bill.items || []) {
      try {
        let product = null;
        if (item._id) product = await Product.findById(item._id).exec();
        if (!product) product = await Product.findOne({ name: item.name }).exec();

        if (!product) {
          console.warn(`Product not found for bill item: ${item.name} (${item._id})`);
          continue;
        }

        const totalToRestore = (Number(item.qty) || 0) + (Number(item.freeQty) || 0);
        product.quantity = (Number(product.quantity) || 0) + totalToRestore;
        await product.save();
      } catch (err) {
        console.error("Failed to restore stock for item", item, err);
      }
    }

    await Bill.findByIdAndDelete(req.params.id);

    try {
      const customerId = bill.customerId || null;
      if (customerId) await recalcCustomerTotals(customerId);
    } catch (err) {
      console.error("Failed to recalc customer totals after bill delete:", err);
    }

    res.json({ success: true, message: "Bill deleted and stock restored" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
