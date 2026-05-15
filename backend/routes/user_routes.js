

const express = require("express");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/usermodel");
const { getConnection, getModels } = require("../config/db"); // ✅ NEW
const auth = require("../middleware/auth");

const router = express.Router();

/* ================= MULTER CONFIG ================= */
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/users");
  },
  filename(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* ================= ADD USER ================= */
router.post("/add", upload.single("logo"), async (req, res) => {
  try {
    const { name, email, password, role, businessType } = req.body;

    if (!name || !email || !password || !role || !businessType) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!["admin", "cashier"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      businessType,
      logo: req.file
        ? `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, "/")}`
        : null,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "User added successfully",
    });
  } catch (error) {
    next(error);
  }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password, force = false } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Account is inactive. Please contact administrator.",
      });
    }

    // Get tenant models for session management
    const tenantDb = getConnection(user.businessType);
    const tenantModels = getModels(tenantDb);
    const LoginSession = tenantModels.LoginSession;
    const GeneralSettings = tenantModels.GeneralSettings;

    // Fetch settings for session timeout
    const settings = await GeneralSettings.findOne({ businessType: user.businessType });
    const timeoutMinutes = settings?.sessionTimeoutMinutes || 30;

    // ✅ CHECK FOR EXISTING ACTIVE SESSION
    if (user.activeToken && !force) {
      // Check if the token is actually still active in LoginSession
      const activeSession = await LoginSession.findOne({ 
        token: user.activeToken, 
        logoutTime: null,
        expiryTime: { $gt: new Date() }
      });

      if (activeSession) {
        return res.status(409).json({
          success: false,
          code: "ALREADY_LOGGED_IN",
          message: "Account is already logged in from another device.",
        });
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, businessType: user.businessType },
      process.env.JWT_SECRET,
      { expiresIn: "10h" } // Max limit, but app-level expiry is enforced by LoginSession
    );

    // ✅ LOGOUT PREVIOUS SESSION IF EXISTS (Force or Auto-Cleanup)
    if (user.activeToken) {
      await LoginSession.findOneAndUpdate(
        { token: user.activeToken, logoutTime: null },
        { logoutTime: new Date(), logoutReason: 'replaced' }
      );
    }

    // Save latest token (single device login)
    user.activeToken = token;
    await user.save();

    // ✅ CREATE NEW LOGIN SESSION
    const expiryDate = new Date(Date.now() + timeoutMinutes * 60 * 1000);
    await LoginSession.create({
      email: user.email,
      role: user.role,
      businessType: user.businessType,
      loginTime: new Date(),
      token: token,
      expiryTime: expiryDate,
      logoutReason: null,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      timeoutMinutes,
      expiresIn: `${timeoutMinutes} minutes`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessType: user.businessType,
        logo: user.logo,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/* ================= LOGOUT ================= */
const dbSelector = require("../middleware/dbSelector");

router.post("/logout", auth, dbSelector, async (req, res) => {
  try {
    const { LoginSession } = req.models;
    const user = await User.findById(req.user.id);

    if (user) {
      const token = req.headers.authorization.split(" ")[1];

      user.activeToken = null;
      await user.save();

      // ✅ UPDATE LOGOUT TIME FOR THE CURRENT SESSION
      await LoginSession.findOneAndUpdate(
        { token: token, logoutTime: null },
        { logoutTime: new Date(), logoutReason: 'manual' }
      );
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
});

/* ================= GET ALL USERS ================= */
router.get("/", auth, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== "superadmin") {
      filter.businessType = req.user.businessType;
    }
    const users = await User.find(filter).select("-password -activeToken");
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
});

/* ================= CHANGE PASSWORD ================= */
router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
});

/* ================= UPDATE USER ================= */
router.put("/:id", auth, upload.single("logo"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) {
        return res.status(409).json({ success: false, message: "Email already in use" });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (role && ["admin", "cashier"].includes(role)) user.role = role;

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
    }

    // If a new file is uploaded, set it. If client requests removal, clear the logo.
    if (req.file) {
      user.logo = `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, "/")}`;
    } else if (req.body && req.body.removeLogo && req.body.removeLogo === "true") {
      user.logo = null;
    }

    await user.save();

    res.status(200).json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
});

/* ================= DELETE USER ================= */
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
});

/* ================= GET LOGIN SESSIONS (ADMIN) ================= */
router.get("/sessions", auth, dbSelector, async (req, res) => {
  try {
    const { LoginSession } = req.models;
    const { email } = req.query;

    const filter = email
      ? { email: { $regex: email, $options: "i" } }
      : {};

    // Fetch sessions
    let sessions = await LoginSession.find(filter).sort({ loginTime: -1 });

    // Normalize and update any sessions that appear expired but have no logoutTime recorded
    const now = new Date();
    const bulkOps = [];

    sessions.forEach((s) => {
      const expiry = s.expiryTime || (s.loginTime ? new Date(new Date(s.loginTime).getTime() + 30 * 60 * 1000) : null);
      if (expiry && !s.logoutTime && expiry <= now) {
        // mark as auto-expired
        bulkOps.push({
          updateOne: {
            filter: { _id: s._id, logoutTime: null },
            update: { logoutTime: expiry, logoutReason: 'expired' },
          },
        });
      }
    });

    if (bulkOps.length) {
      await LoginSession.bulkWrite(bulkOps);
      // re-fetch sessions after updates
      sessions = await LoginSession.find(filter).sort({ loginTime: -1 });
    }

    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch login sessions",
    });
  }
});

module.exports = router;
