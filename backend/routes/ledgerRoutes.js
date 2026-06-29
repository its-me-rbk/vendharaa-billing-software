const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const dbSelector = require("../middleware/dbSelector");

router.use(auth);
router.use(dbSelector);

/**
 * @route   GET /api/ledger
 * @desc    Get ledger entries with filtering and summary statistics
 */
router.get("/", async (req, res, next) => {
  const { Ledger } = req.models;
  const businessType = req.user.businessType;

  try {
    const { startDate, endDate, category, type, search, accountId } = req.query;

    // Filter by tenant businessType
    const filter = { businessType };

    // AccountId filter
    if (accountId && accountId !== "All") {
      filter.accountId = accountId;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to the end of that day (23:59:59.999)
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    // Category filter
    if (category && category !== "All") {
      filter.category = category;
    }

    // Transaction type filter (credit / debit)
    if (type && type !== "All") {
      filter.type = type;
    }

    // Search filter
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { description: searchRegex },
        { partyName: searchRegex }
      ];
    }

    // Fetch transactions sorted by date (newest first)
    const transactions = await Ledger.find(filter).sort({ date: -1, createdAt: -1 });

    // Calculate statistics based on the FILTERED dataset (or should it be all time? Filtered is usually preferred for matching search view)
    // Let's also calculate ALL TIME or current filter stats. Usually, showing matching stats for the selected filters is most helpful!
    let totalCredit = 0;
    let totalDebit = 0;

    transactions.forEach((tx) => {
      if (tx.type === "credit") {
        totalCredit += tx.amount;
      } else if (tx.type === "debit") {
        totalDebit += tx.amount;
      }
    });

    const netBalance = totalCredit - totalDebit;

    res.status(200).json({
      success: true,
      data: transactions,
      stats: {
        totalCredit,
        totalDebit,
        netBalance,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/ledger
 * @desc    Add a manual ledger entry
 */
router.post("/", async (req, res, next) => {
  const { Ledger } = req.models;
  const businessType = req.user.businessType;

  try {
    const { date, description, type, amount, category, paymentMethod, partyName, accountId } = req.body;

    if (!description || !type || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: "Description, type, amount, and category are required",
      });
    }

    if (!["credit", "debit"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be either credit or debit",
      });
    }

    let accountNameVal = "";
    if (accountId) {
      const { Account } = req.models;
      const acc = await Account.findById(accountId);
      if (acc) accountNameVal = acc.name;
    }

    const tx = await Ledger.create({
      date: date || new Date(),
      description,
      type,
      amount: Number(amount),
      category,
      paymentMethod: paymentMethod || "Cash",
      partyName: partyName || "",
      accountId: accountId || null,
      accountName: accountNameVal || "",
      referenceType: "Manual",
      businessType,
    });

    res.status(201).json({
      success: true,
      message: "Ledger entry added successfully",
      data: tx,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/ledger/:id
 * @desc    Update a manual ledger entry
 */
router.put("/:id", async (req, res, next) => {
  const { Ledger } = req.models;
  try {
    const { date, description, type, amount, category, paymentMethod, partyName, accountId } = req.body;

    const tx = await Ledger.findById(req.params.id);
    if (!tx) {
      return res.status(404).json({
        success: false,
        message: "Ledger entry not found",
      });
    }

    // Optional: Warn or restrict if it's not a manual entry
    if (tx.referenceType !== "Manual") {
      // Allow editing basic details but prevent direction/amount modifications to avoid accounting mismatch
      // Let's just allow it but log a warning or restrict type/amount changes if necessary.
      // For simplicity, we can let admins override it but preserve reference fields.
    }

    if (date) tx.date = date;
    if (description) tx.description = description;
    if (type) tx.type = type;
    if (amount !== undefined) tx.amount = Number(amount);
    if (category) tx.category = category;
    if (paymentMethod) tx.paymentMethod = paymentMethod;
    if (partyName !== undefined) tx.partyName = partyName;
    if (accountId !== undefined) {
      tx.accountId = accountId || null;
      if (accountId) {
        const { Account } = req.models;
        const acc = await Account.findById(accountId);
        tx.accountName = acc ? acc.name : "";
      } else {
        tx.accountName = "";
      }
    }

    const updatedTx = await tx.save();

    res.status(200).json({
      success: true,
      message: "Ledger entry updated successfully",
      data: updatedTx,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/ledger/:id
 * @desc    Delete a ledger entry
 */
router.delete("/:id", async (req, res, next) => {
  const { Ledger } = req.models;
  try {
    const tx = await Ledger.findById(req.params.id);
    if (!tx) {
      return res.status(404).json({
        success: false,
        message: "Ledger entry not found",
      });
    }

    await Ledger.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Ledger entry deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
