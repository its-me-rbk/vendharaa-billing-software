const express=require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const dbSelector = require("../middleware/dbSelector");

router.use(auth);
router.use(dbSelector);

/**
 * @route   POST /api/customers
 * @desc    Add new customer
 */
router.post("/", async (req, res, next) => {
  const { Customer, Bill } = req.models;
  const businessType = req.user.businessType;

  try {
    const {
      name,
      phone,
      email,
      loyaltyPoints,
      address,
      notes,
    } = req.body;

    const trimmedName = (name || "").trim();
    const trimmedPhone = (phone || "").trim();

    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const customerData = {
      name: trimmedName,
      email,
      loyaltyPoints,
      address,
      notes,
      businessType
    };
    if (trimmedPhone) customerData.phone = trimmedPhone;

    // Ensure any legacy unique index on phone is dropped so multiple customers can share a number
    try { await Customer.collection.dropIndex("phone_1"); } catch (_) {}

    const customer = await Customer.create(customerData);

    // Backfill historical bills that were created before this customer existed (match by phone only)
    try {
      const matchPhones = [];
      if (customer.phone) matchPhones.push({ customerPhone: String(customer.phone) });

      if (matchPhones.length > 0) {
        const filter = {
          $and: [
            { $or: matchPhones },
            { $or: [{ customerId: { $exists: false } }, { customerId: null }] },
          ],
        };

        await Bill.updateMany(filter, { $set: { customerId: customer._id } });

        // Recalculate totals from all bills for this customer (including backfilled ones)
        const bills = await Bill.find({ customerId: customer._id });
        const total = bills.reduce((s, b) => s + (Number(b.total) || 0), 0);
        const points = bills.reduce((s, b) => s + Math.floor((Number(b.total) || 0) / 1000), 0);
        await Customer.findByIdAndUpdate(customer._id, { totalPurchase: total, loyaltyPoints: points });
      }
    } catch (err) {
      console.error('Backfill historical bills error for customer', customer._id, err);
    }

    res.status(201).json({
      success: true,
      message: "Customer added successfully",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/customers
 * @desc    Get all customers
 */
router.get("/", async (req, res, next) => {
  const { Customer } = req.models;
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/customers/:id
 * @desc    Update customer
 */
router.put("/:id", async (req, res, next) => {
  const { Customer } = req.models;
  try {
    const updates = req.body;
    const customer = await Customer.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/customers/:id
 * @desc    Delete customer
 */
router.delete("/:id", async (req, res, next) => {
  const { Customer } = req.models;
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
    res.status(200).json({ success: true, message: "Customer deleted" });
  } catch (error) {
    next(error);
  }
});

module.exports=router;
