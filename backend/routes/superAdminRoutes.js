const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/usermodel");
const ActivityLog = require("../models/ActivityLog");
const bcrypt = require("bcryptjs");
const { connections, getModels } = require("../config/db");

// Middleware to ensure user is superadmin
const superAdminOnly = (req, res, next) => {
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Super Admin access required" });
  }
  next();
};

router.use(auth);
router.use(superAdminOnly);

/* ================= CONSOLIDATED SUMMARY ================= */
router.get("/summary", async (req, res) => {
  try {
    const agroModels = getModels(connections.agro);
    const pharmaModels = getModels(connections.pharma);

    const [agroBills, pharmaBills] = await Promise.all([
      agroModels.Bill.find(),
      pharmaModels.Bill.find()
    ]);

    const agroRevenue = agroBills.reduce((acc, b) => acc + (b.total || 0), 0);
    const pharmaRevenue = pharmaBills.reduce((acc, b) => acc + (b.total || 0), 0);

    const agroSold = agroBills.reduce((acc, b) => acc + b.items.reduce((sum, i) => sum + (i.qty || 0), 0), 0);
    const pharmaSold = pharmaBills.reduce((acc, b) => acc + b.items.reduce((sum, i) => sum + (i.qty || 0), 0), 0);

    res.json({
      success: true,
      data: {
        totalRevenue: agroRevenue + pharmaRevenue,
        agroRevenue,
        pharmaRevenue,
        totalBills: agroBills.length + pharmaBills.length,
        totalItemsSold: agroSold + pharmaSold,
        agroBillsCount: agroBills.length,
        pharmaBillsCount: pharmaBills.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ================= ACTIVITY LOGS ================= */
router.get("/logs", async (req, res) => {
  try {
    const { page = 1, limit = 50, businessType, method } = req.query;
    const filter = {};
    if (businessType && businessType !== 'all') filter.businessType = businessType;
    if (method) filter.method = method;

    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await ActivityLog.countDocuments(filter);

    res.json({
      success: true,
      logs,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ================= CONSOLIDATED USERS ================= */
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/users", async (req, res) => {
  try {
    const { name, email, password, role, businessType } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name, email, password: hashedPassword, role, businessType
    });
    
    await newUser.save();
    res.status(201).json({ success: true, message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const { name, email, password, role, businessType, status } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ success: false, message: "Email already in use" });
      user.email = email;
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (businessType) user.businessType = businessType;
    if (status) user.status = status;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: "You cannot delete yourself" });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
