const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const dbSelector = require("../middleware/dbSelector");

router.use(auth);
router.use(dbSelector);

/**
 * @route   POST /api/suppliers
 * @desc    Add new supplier
 */
router.post("/", async (req, res, next) => {
  const { Supplier } = req.models;
  const businessType = req.user.businessType;

  try {
    const {
      name,
      phone,
      email,
      address,
      productsSupplied,
      initialDue,
    } = req.body;

    // Basic validation
    if (!name || !phone) {
      return res.status(400).json({
        message: "Supplier name and contact number are required",
      });
    }

    const supplier = new Supplier({
      name,
      phone,
      email,
      address,
      productsSupplied,
      initialDue,
      businessType
    });

    const savedSupplier = await supplier.save();

    res.status(201).json({
      message: "Supplier added successfully",
      supplier: savedSupplier,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/suppliers
 * @desc    Get all suppliers
 */
router.get("/", async (req, res, next) => {
  const { Supplier } = req.models;
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/suppliers/:id
 * @desc    Delete supplier
 */
router.delete("/:id", async (req, res, next) => {
  const { Supplier } = req.models;
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      const error = new Error("Supplier not found");
      error.statusCode = 404;
      throw error;
    }
    res.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/suppliers/:id
 * @desc    Update supplier
 */
router.put("/:id", async (req, res, next) => {
  const { Supplier } = req.models;
  try {
    const updates = req.body;
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!supplier) {
      const error = new Error("Supplier not found");
      error.statusCode = 404;
      throw error;
    }
    res.json({ message: 'Supplier updated', supplier });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
