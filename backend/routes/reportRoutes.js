const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Bill = require("../models/Bill");
const Product = require("../models/Product");

/* ---------------- REPORT SUMMARY ---------------- */
router.get("/summary", auth, async (req, res) => {
  try {
    const bills = await Bill.find();

    let totalRevenue = 0;
    let itemsSold = 0;

    bills.forEach((b) => {
      totalRevenue += b.total || 0;
      b.items.forEach((i) => {
        itemsSold += (i.qty || 0) + (i.freeQty || 0);
      });
    });

    const totalProfit = totalRevenue * 0.3; // 30% margin
    const avgOrderValue = bills.length
      ? totalRevenue / bills.length
      : 0;

    res.json({
      totalRevenue,
      totalProfit,
      itemsSold,
      avgOrderValue,
      totalBills: bills.length,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate report summary" });
  }
});

/* ---------------- TOP PRODUCTS ---------------- */
router.get("/top-products", auth, async (req, res) => {
  try {
    const bills = await Bill.find();

    const productMap = {};

    bills.forEach((b) => {
      b.items.forEach((i) => {
        if (!productMap[i.name]) {
          productMap[i.name] = {
            product: i.name,
            revenue: 0,
            soldQty: 0,
          };
        }

        productMap[i.name].soldQty += (i.qty || 0) + (i.freeQty || 0);
        productMap[i.name].revenue += i.qty * i.price;
      });
    });

    const result = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to fetch top products" });
  }
});

/* ---------------- EXPIRING PRODUCTS ---------------- */
router.get("/expiring-products", auth, async (req, res) => {
  try {
    const products = await Product.find();
    const today = new Date();
    const expiring = [];

    products.forEach((p) => {
      p.batches.forEach((b) => {
        if (!b.expiryDate) return;

        const days =
          (new Date(b.expiryDate) - today) /
          (1000 * 60 * 60 * 24);

        if (days > 0 && days <= 30) {
          expiring.push({
            product: p.name,
            batch: b.batchNumber,
            expiryDate: b.expiryDate,
            quantity: b.quantity,
            value: b.quantity * b.price,
          });
        }
      });
    });

    res.json(expiring);
  } catch {
    res.status(500).json({ error: "Failed to fetch expiring products" });
  }
});

/* ---------------- SALES TREND (MONTHLY) ---------------- */
router.get("/sales-trend", auth, async (req, res) => {
  try {
    const salesTrend = await Bill.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          sales: { $sum: "$total" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 }
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const result = salesTrend.map(item => ({
      month: months[item._id.month - 1],
      sales: item.sales,
      profit: Math.round(item.sales * 0.3) // 30% margin
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- CATEGORY DISTRIBUTION ---------------- */
router.get("/category-distribution", auth, async (req, res) => {
  try {
    const distribution = await Bill.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: { $ifNull: ["$items.category", "General"] },
          sales: { $sum: { $multiply: ["$items.qty", "$items.price"] } }
        }
      }
    ]);

    const totalSales = distribution.reduce((sum, item) => sum + item.sales, 0);
    const result = distribution.map(item => ({
      category: item._id,
      sales: item.sales,
      percentage: totalSales > 0 ? Math.round((item.sales / totalSales) * 100) : 0
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
