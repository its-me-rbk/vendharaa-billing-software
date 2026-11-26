
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const dbSelector = require("../middleware/dbSelector");

router.use(auth);
router.use(dbSelector);

/**
 * CREATE PRODUCT
 */
router.post("/", async (req, res, next) => {
  try {
    const { name, category, manufacturer, quantity, price, ptr, mrp, gst, hsn, barcode, batches, offers } = req.body;
    const { Product } = req.models;

    if (!name) return res.status(400).json({ success: false, message: "Name required" });

    let existing = await Product.findOne({ name });
    if (existing) return res.status(409).json({ success: false, message: "Product already exists" });

    const ptrVal = Number(ptr ?? price) || 0;
    const mrpVal = Number(mrp) || 0;

    const productData = {
      name,
      category,
      manufacturer,
      quantity: Number(quantity) || 0,
      price: ptrVal,
      ptr: ptrVal,
      mrp: mrpVal,
      gst: Number(gst) || 0,
      hsn: hsn || "",
      barcode: barcode || "",
      businessType: req.user.businessType
    };

    if (req.user.businessType === 'pharma' && batches) {
      productData.batches = batches;
    }

    if (Array.isArray(offers)) {
      productData.offers = offers
        .filter(o => Number(o.buyQty) > 0 && Number(o.freeQty) > 0)
        .map(o => ({ buyQty: Number(o.buyQty), freeQty: Number(o.freeQty) }));
    }

    const product = await Product.create(productData);
    try {
      const { StockTransaction } = req.models;
      if (StockTransaction && Number(product.quantity) > 0) {
        await StockTransaction.create({
          productId: product._id,
          productName: product.name,
          manufacturer: product.manufacturer || "",
          type: "initial",
          quantity: Number(product.quantity),
          businessType: req.user.businessType,
        });
      }
    } catch (stErr) {
      console.error("Failed to record initial StockTransaction:", stErr);
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

/**
 * GET ALL PRODUCTS
 */
router.get("/", async (req, res) => {
  const { Product } = req.models;
  const products = await Product.find();
  res.json(products);
});

/**
 * TOP PERFORMING PRODUCTS
 */
router.get("/top-performing", async (req, res) => {
  const { Bill } = req.models;
  const data = await Bill.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        soldQty: { $sum: { $add: ["$items.qty", { $ifNull: ["$items.freeQty", 0] }] } },
        revenue: {
          $sum: { $multiply: ["$items.qty", "$items.price"] },
        },
      },
    },
    { $sort: { soldQty: -1 } },
    { $limit: 5 },
  ]);

  res.json(data);
});

/**
 * UPDATE PRODUCT
 */
router.put("/:id", async (req, res, next) => {
  try {
    const { Product, StockTransaction } = req.models;
    const prevProduct = await Product.findById(req.params.id);
    if (!prevProduct) return res.status(404).json({ success: false, message: "Product not found" });

    const prevQty = Number(prevProduct.quantity) || 0;
    const updates = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });

    try {
      const newQty = Number(product.quantity) || 0;
      const delta = newQty - prevQty;
      if (StockTransaction && delta > 0) {
        await StockTransaction.create({
          productId: product._id,
          productName: product.name,
          manufacturer: product.manufacturer || "",
          type: "purchase",
          quantity: delta,
          businessType: req.user.businessType,
        });
      }
    } catch (stErr) {
      console.error("Failed to record purchase StockTransaction:", stErr);
    }

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

/**
 * ARCHIVE BATCH
 */
router.post("/:id/batches/:batchId/archive", async (req, res, next) => {
  try {
    const { Product } = req.models;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const batchIndex = product.batches.findIndex(b => b._id.toString() === req.params.batchId);
    if (batchIndex === -1) return res.status(404).json({ success: false, message: "Batch not found" });

    const [batch] = product.batches.splice(batchIndex, 1);
    product.archivedBatches.push({
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      quantity: batch.quantity,
      archivedAt: new Date()
    });

    // Recalculate total quantity
    product.quantity = product.batches.reduce((sum, b) => sum + b.quantity, 0);

    await product.save();
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

/**
 * RESTORE BATCH
 */
router.post("/:id/archived-batches/:batchId/restore", async (req, res, next) => {
  try {
    const { Product } = req.models;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const archivedIndex = product.archivedBatches.findIndex(b => b._id.toString() === req.params.batchId);
    if (archivedIndex === -1) return res.status(404).json({ success: false, message: "Archived batch not found" });

    const [batch] = product.archivedBatches.splice(archivedIndex, 1);
    product.batches.push({
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      quantity: batch.quantity
    });

    // Recalculate total quantity
    product.quantity = product.batches.reduce((sum, b) => sum + b.quantity, 0);

    await product.save();
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE PRODUCT
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const { Product } = req.models;
    const prod = await Product.findByIdAndDelete(req.params.id);
    if (!prod) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
