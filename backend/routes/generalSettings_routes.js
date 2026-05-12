const express = require("express");
const auth = require("../middleware/auth");
const GeneralSettings = require("../models/GeneralSettings_model");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// multer for logo upload
const fs = require("fs");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = "uploads/settings";
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      // ignore
    }
    cb(null, dir);
  },
  filename(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

/**
 * CREATE or UPDATE settings
 */
router.post("/save", auth, upload.single("logo"), async (req, res) => {
  try {
    // support multipart/form-data (with optional logo file) or application/json
    let payload = req.body || {};

    // multer may leave req.body as a string in some edge cases; ensure object
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      payload = {};
    }

    if (req.file) {
      payload.logo = `${req.protocol}://${req.get("host")}/${req.file.path.replace(/\\/g, "/")}`;
    }

    // handle explicit logo removal flag from the client
    if (payload.removeLogo === "true" || payload.removeLogo === true) {
      payload.logo = null;
    }
    // remove helper flag before update
    if (Object.prototype.hasOwnProperty.call(payload, "removeLogo")) delete payload.removeLogo;

    let settings = await GeneralSettings.findOne();

    if (settings) {
      settings = await GeneralSettings.findByIdAndUpdate(
        settings._id,
        payload,
        { new: true }
      );
    } else {
      settings = await GeneralSettings.create(payload);
    }

    res.status(200).json({ success: true, message: "Settings saved successfully", data: settings });
  } catch (error) {
    next(error);
  }
});

/**
 * GET settings
 */
router.get("/get", auth, async (req, res, next) => {
  try {
    const settings = await GeneralSettings.findOne();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

/**
 * Public GET for login page (no auth) - returns minimal fields
 */
router.get("/public", async (req, res, next) => {
  try {
    const settings = await GeneralSettings.findOne();
    if (!settings) return res.status(200).json({ success: true, data: { pharmacyName: null, logo: null } });

    // Only expose minimal fields needed by login page
    const payload = {
      pharmacyName: settings.pharmacyName || null,
      logo: settings.logo || null,
    };

    res.status(200).json({ success: true, data: payload });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
