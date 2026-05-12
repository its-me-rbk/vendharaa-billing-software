
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Product = require("../models/Product");
const Bill = require("../models/Bill");

/**
 * CREATE PRODUCT
 */
router.post("/", auth, async (req, res, next) => {
  try {
    const { name, category, manufacturer, quantity, price, gst, hsn, barcode } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Name required" });

    let existing = await Product.findOne({ name });
    if (existing) return res.status(409).json({ success: false, message: "Product already exists" });

    const product = await Product.create({
      name,
      category,
      manufacturer,
      quantity: Number(quantity) || 0,
      price: Number(price) || 0,
      gst: Number(gst) || 0,
      hsn: hsn || "",
      barcode: barcode || "",
    });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

/**
 * GET ALL PRODUCTS
 */
router.get("/", auth, async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

/**
 * TOP PERFORMING PRODUCTS
 */
router.get("/top-performing", auth, async (req, res) => {
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
router.put("/:id", auth, async (req, res, next) => {
  try {
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
router.delete("/:id", auth, async (req, res, next) => {
  try {
    const prod = await Product.findByIdAndDelete(req.params.id);
    if (!prod) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
