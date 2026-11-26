const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const dbSelector = require("../middleware/dbSelector");

router.use(auth);
router.use(dbSelector);

/* ---------------- REPORT SUMMARY ---------------- */
router.get("/summary", async (req, res) => {
  const { Bill } = req.models;
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
router.get("/top-products", async (req, res) => {
  const { Bill } = req.models;
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
router.get("/expiring-products", async (req, res) => {
  const { Product } = req.models;
  try {
    const products = await Product.find();
    const today = new Date();
    const expiring = [];

    products.forEach((p) => {
      if (p.batches) {
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
              value: b.quantity * p.price,
            });
          }
        });
      }
    });

    res.json(expiring);
  } catch {
    res.status(500).json({ error: "Failed to fetch expiring products" });
  }
});

/* ---------------- SALES TREND (MONTHLY) ---------------- */
router.get("/sales-trend", async (req, res) => {
  const { Bill } = req.models;
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
router.get("/category-distribution", async (req, res) => {
  const { Bill } = req.models;
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

/* ---------------- SUPPLIER STOCK & SALES REPORT ---------------- */
router.get("/supplier-stock-sales", async (req, res) => {
  const { Product, Bill, StockTransaction, GeneralSettings } = req.models;
  try {
    const { supplier = "all", startDate, endDate } = req.query;

    const now = new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(now.getFullYear(), now.getMonth() - 1, 1);
    start.setHours(0, 0, 0, 0);

    const end = endDate
      ? new Date(endDate)
      : new Date(now.getFullYear(), now.getMonth(), 0);
    end.setHours(23, 59, 59, 999);

    const periodMs = Math.max(86400000, end.getTime() - start.getTime() + 1);
    const prevStart = new Date(start.getTime() - periodMs);
    const prevEnd = new Date(start.getTime() - 1);

    const productQuery = supplier && supplier !== "all" ? { manufacturer: supplier } : {};
    const [products, bills, stockTxns, settings] = await Promise.all([
      Product.find(productQuery).sort({ name: 1 }).lean(),
      Bill.find({ createdAt: { $gte: prevStart } }).lean(),
      StockTransaction ? StockTransaction.find({ createdAt: { $gte: start } }).lean() : [],
      GeneralSettings ? GeneralSettings.findOne().lean() : null,
    ]);

    const txnProductSet = new Set(
      (await (StockTransaction ? StockTransaction.distinct("productId") : [])).map((id) => String(id))
    );

    const salesMap = {};
    const afterEndSoldMap = {};
    const prevSalesMap = {};

    for (const bill of bills) {
      const bTime = new Date(bill.createdAt).getTime();
      for (const item of bill.items || []) {
        const pid = String(item._id);
        const paid = Number(item.qty) || 0;
        const free = Number(item.freeQty) || 0;
        const unitPtr = Number(item.ptr ?? item.price) || 0;

        if (bTime >= start.getTime() && bTime <= end.getTime()) {
          if (!salesMap[pid]) salesMap[pid] = { paid: 0, free: 0, value: 0 };
          salesMap[pid].paid += paid;
          salesMap[pid].free += free;
          salesMap[pid].value += unitPtr * paid;
        } else if (bTime > end.getTime()) {
          afterEndSoldMap[pid] = (afterEndSoldMap[pid] || 0) + paid + free;
        } else if (bTime >= prevStart.getTime() && bTime <= prevEnd.getTime()) {
          prevSalesMap[pid] = (prevSalesMap[pid] || 0) + paid + free;
        }
      }
    }

    const purchaseInRangeMap = {};
    const purchaseAfterEndMap = {};
    for (const tx of stockTxns) {
      const pid = String(tx.productId);
      const tTime = new Date(tx.createdAt).getTime();
      const qty = Number(tx.quantity) || 0;
      if (tTime >= start.getTime() && tTime <= end.getTime()) {
        purchaseInRangeMap[pid] = (purchaseInRangeMap[pid] || 0) + qty;
      } else if (tTime > end.getTime()) {
        purchaseAfterEndMap[pid] = (purchaseAfterEndMap[pid] || 0) + qty;
      }
    }

    const rows = products.map((p, idx) => {
      const pid = String(p._id);
      const s = salesMap[pid] || { paid: 0, free: 0, value: 0 };
      const totalSales = s.paid + s.free;
      const soldAfter = afterEndSoldMap[pid] || 0;
      const purchasedAfter = purchaseAfterEndMap[pid] || 0;

      let purchase = purchaseInRangeMap[pid] || 0;
      if (!txnProductSet.has(pid) && p.createdAt) {
        const cTime = new Date(p.createdAt).getTime();
        if (cTime >= start.getTime() && cTime <= end.getTime()) {
          purchase = (Number(p.quantity) || 0) + soldAfter + totalSales;
        }
      }

      const closingStock = Math.max(0, (Number(p.quantity) || 0) + soldAfter - purchasedAfter);
      const openingStock = Math.max(0, closingStock + totalSales - purchase);

      let expiry = "—";
      if (Array.isArray(p.batches) && p.batches.length > 0) {
        const activeBatches = p.batches.filter((b) => b.expiryDate && (Number(b.quantity) || 0) > 0);
        const pool = activeBatches.length > 0 ? activeBatches : p.batches.filter((b) => b.expiryDate);
        if (pool.length > 0) {
          pool.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
          const d = new Date(pool[0].expiryDate);
          expiry = `${d.getMonth() + 1}-${d.getFullYear()}`;
        }
      }

      return {
        sl: idx + 1,
        productId: pid,
        name: p.name,
        manufacturer: p.manufacturer || "—",
        opening: openingStock,
        purchase,
        paidSales: s.paid,
        freeSales: s.free,
        totalSales,
        closing: closingStock,
        expiry,
        salesValue: Number(s.value.toFixed(2)),
        prevSales: prevSalesMap[pid] || 0,
      };
    });

    const totals = rows.reduce(
      (acc, r) => ({
        opening: acc.opening + r.opening,
        purchase: acc.purchase + r.purchase,
        paidSales: acc.paidSales + r.paidSales,
        freeSales: acc.freeSales + r.freeSales,
        totalSales: acc.totalSales + r.totalSales,
        closing: acc.closing + r.closing,
        salesValue: Number((acc.salesValue + r.salesValue).toFixed(2)),
        prevSales: acc.prevSales + r.prevSales,
      }),
      { opening: 0, purchase: 0, paidSales: 0, freeSales: 0, totalSales: 0, closing: 0, salesValue: 0, prevSales: 0 }
    );

    res.json({
      success: true,
      supplier: supplier === "all" ? "All Suppliers" : supplier,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      business: {
        name: settings?.pharmacyName || "Vendharaa Pharmaceuticals",
        address: settings?.address || "",
      },
      rows,
      totals,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to generate supplier report" });
  }
});

module.exports = router;
