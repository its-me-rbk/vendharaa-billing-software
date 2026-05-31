const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const dbSelector = require("../middleware/dbSelector");

router.use(auth);
router.use(dbSelector);

/**
 * @route   GET /api/accounts
 * @desc    Get all accounts with dynamic balance calculations
 */
router.get("/", async (req, res, next) => {
  const { Account, Ledger } = req.models;
  const businessType = req.user.businessType;

  // If superadmin requests, they can override tenant businessType via x-business-type header
  let targetBusiness = businessType;
  if (req.user.role === "superadmin" && req.headers["x-business-type"]) {
    targetBusiness = req.headers["x-business-type"];
  }

  try {
    // 1. Fetch all accounts
    const accounts = await Account.find({ businessType: targetBusiness }).sort({ createdAt: 1 });

    // 2. Aggregate ledger transactions to compute credits/debits per account
    const ledgerStats = await Ledger.aggregate([
      { $match: { businessType: targetBusiness } },
      {
        $group: {
          _id: "$accountId",
          totalCredit: {
            $sum: {
              $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0]
            }
          },
          totalDebit: {
            $sum: {
              $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0]
            }
          }
        }
      }
    ]);

    // Create a lookup map of ledger statistics
    const statsMap = {};
    ledgerStats.forEach(stat => {
      if (stat._id) {
        statsMap[stat._id.toString()] = {
          credit: stat.totalCredit || 0,
          debit: stat.totalDebit || 0
        };
      }
    });

    // 3. Map dynamic balances
    const data = accounts.map(acc => {
      const stats = statsMap[acc._id.toString()] || { credit: 0, debit: 0 };
      const balance = acc.initialBalance + stats.credit - stats.debit;
      return {
        _id: acc._id,
        name: acc.name,
        type: acc.type,
        description: acc.description,
        initialBalance: acc.initialBalance,
        balance: Number(balance.toFixed(2)),
        createdAt: acc.createdAt,
        updatedAt: acc.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/accounts
 * @desc    Create a new store account
 */
router.post("/", async (req, res, next) => {
  const { Account } = req.models;
  const businessType = req.user.businessType;

  let targetBusiness = businessType;
  if (req.user.role === "superadmin" && req.headers["x-business-type"]) {
    targetBusiness = req.headers["x-business-type"];
  }

  try {
    const { name, type, description, initialBalance } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: "Account name and type are required"
      });
    }

    // Check if account name already exists in this tenant
    const existing = await Account.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      businessType: targetBusiness
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `An account named "${name}" already exists`
      });
    }

    const account = await Account.create({
      name: name.trim(),
      type,
      description: description || "",
      initialBalance: Number(initialBalance) || 0,
      businessType: targetBusiness
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: account
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/accounts/:id
 * @desc    Update account details
 */
router.put("/:id", async (req, res, next) => {
  const { Account } = req.models;
  try {
    const { name, type, description, initialBalance } = req.body;

    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    // Protect core default seeded accounts from renaming to prevent issues
    if (["Cash", "General Bank"].includes(account.name) && name && name !== account.name) {
      return res.status(400).json({
        success: false,
        message: "Cannot rename default core accounts (Cash, General Bank)"
      });
    }

    if (name) account.name = name.trim();
    if (type) account.type = type;
    if (description !== undefined) account.description = description;
    if (initialBalance !== undefined) account.initialBalance = Number(initialBalance) || 0;

    const updated = await account.save();

    res.status(200).json({
      success: true,
      message: "Account updated successfully",
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/accounts/:id
 * @desc    Delete an account
 */
router.delete("/:id", async (req, res, next) => {
  const { Account } = req.models;
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    // Block deletion of default core seeded accounts
    if (["Cash", "General Bank"].includes(account.name)) {
      return res.status(400).json({
        success: false,
        message: "Seeded core accounts (Cash, General Bank) cannot be deleted"
      });
    }

    await Account.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
