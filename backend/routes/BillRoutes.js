
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const dbSelector = require("../middleware/dbSelector");

router.use(auth);
router.use(dbSelector);

// Helper: recalculate customer's totalPurchase and loyaltyPoints from bills
async function recalcCustomerTotals(customerId, models) {
  if (!customerId) return;
  const { Bill, Customer } = models;
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

// CREATE BILL + DEDUCT STOCK
router.post("/", async (req, res, next) => {
  const { Bill, Product } = req.models;
  const businessType = req.user.businessType;

  try {
    const { items } = req.body;

    for (let item of items) {
      const product = await Product.findById(item._id || item.productId);
      if (!product) continue;

      const totalToDeduct = (Number(item.qty) || 0) + (Number(item.freeQty) || 0);

      if (businessType === 'pharma' && item.batchNumber) {
        // Pharma: Deduct from specific batch
        const batch = product.batches.find(b => b.batchNumber === item.batchNumber);
        if (!batch || batch.quantity < totalToDeduct) {
          return res.status(400).json({
            error: `Not enough stock in batch ${item.batchNumber} for ${item.name}.`,
          });
        }
        batch.quantity -= totalToDeduct;
        product.quantity -= totalToDeduct; // Keep total in sync
      } else {
        // Agro: direct quantity deduction
        if (product.quantity < totalToDeduct) {
          return res.status(400).json({
            error: `Not enough stock for ${item.name}. Available: ${product.quantity}`,
          });
        }
        product.quantity -= totalToDeduct;
      }
      
      await product.save();
    }

    // Attach businessType and metadata
    const incoming = { 
      ...req.body, 
      businessType,
      items: req.body.items.map(item => ({
        ...item,
        businessType
      }))
    };
    
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
      if (customerId) await recalcCustomerTotals(customerId, req.models);
    } catch (err) {
      console.error("Failed to recalc customer totalPurchase after bill create:", err);
    }

    res.json({ success: true, bill });
  } catch (err) {
    next(err);
  }
});

// GET DUE BILLS (partial or unpaid)
router.get("/due", async (req, res) => {
  const { Bill } = req.models;
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
router.post("/:id/payments", async (req, res, next) => {
  const { Bill } = req.models;
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
      if (bill.paid && bill.customerId) await recalcCustomerTotals(bill.customerId, req.models);
    } catch (err) {
      console.error("Failed to recalc customer totals after payment:", err);
    }

    res.json({ success: true, bill });
  } catch (err) {
    next(err);
  }
});

// GET ALL BILLS
router.get("/", async (req, res, next) => {
  const { Bill } = req.models;
  try {
    const bills = await Bill.find().sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    next(err);
  }
});

// GET SINGLE BILL
router.get("/:id", async (req, res) => {
  const { Bill } = req.models;
  try {
    const bill = await Bill.findById(req.params.id);
    res.json(bill);
  } catch {
    res.status(500).json({ error: "Bill not found" });
  }
});

// DELETE BILL + RESTORE STOCK
router.delete("/:id", async (req, res, next) => {
  const { Bill, Product } = req.models;
  const businessType = req.user.businessType;

  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });

    for (let item of bill.items || []) {
      try {
        const product = await Product.findById(item._id).exec();
        if (!product) continue;

        const totalToRestore = (Number(item.qty) || 0) + (Number(item.freeQty) || 0);

        if (businessType === 'pharma' && item.batchNumber) {
          const batch = product.batches.find(b => b.batchNumber === item.batchNumber);
          if (batch) batch.quantity += totalToRestore;
          product.quantity += totalToRestore;
        } else {
          product.quantity = (Number(product.quantity) || 0) + totalToRestore;
        }
        
        await product.save();
      } catch (err) {
        console.error("Failed to restore stock for item", item, err);
      }
    }

    await Bill.findByIdAndDelete(req.params.id);

    try {
      const customerId = bill.customerId || null;
      if (customerId) await recalcCustomerTotals(customerId, req.models);
    } catch (err) {
      console.error("Failed to recalc customer totals after bill delete:", err);
    }

    res.json({ success: true, message: "Bill deleted and stock restored" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
