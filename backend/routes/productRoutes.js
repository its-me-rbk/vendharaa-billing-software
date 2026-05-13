
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
    const { name, category, manufacturer, quantity, price, gst, hsn, barcode, batches } = req.body;
    const { Product } = req.models;

    if (!name) return res.status(400).json({ success: false, message: "Name required" });

    let existing = await Product.findOne({ name });
    if (existing) return res.status(409).json({ success: false, message: "Product already exists" });

    const productData = {
      name,
      category,
      manufacturer,
      quantity: Number(quantity) || 0,
      price: Number(price) || 0,
      gst: Number(gst) || 0,
      hsn: hsn || "",
      barcode: barcode || "",
      businessType: req.user.businessType
    };

    if (req.user.businessType === 'pharma' && batches) {
      productData.batches = batches;
    }

    const product = await Product.create(productData);
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
    const { Product } = req.models;
    const updates = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
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
