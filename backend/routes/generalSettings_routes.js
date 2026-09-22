const express = require("express");
const auth = require("../middleware/auth");
const dbSelector = require("../middleware/dbSelector");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getConnection, getModels } = require("../config/db");

const router = express.Router();

// multer for logo upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * CREATE or UPDATE settings
 */
router.post("/save", auth, dbSelector, upload.single("logo"), async (req, res, next) => {
  const { GeneralSettings } = req.models;
  try {
    let payload = req.body || {};
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      payload = {};
    }

    if (req.file) {
      payload.logo = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    }

    if (payload.removeLogo === "true" || payload.removeLogo === true) {
      payload.logo = null;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "removeLogo")) delete payload.removeLogo;

    // Strip internal/immutable fields
    delete payload._id;
    delete payload.__v;
    delete payload.createdAt;
    delete payload.updatedAt;

    // Sanitize boolean fields (convert strings or remove empty strings)
    const booleanFields = ["sessionTimeoutEnabled", "showLogo", "printGST", "autoPrint"];
    booleanFields.forEach((field) => {
      if (payload[field] !== undefined) {
        if (payload[field] === "true" || payload[field] === true || payload[field] === 1 || payload[field] === "1") {
          payload[field] = true;
        } else if (payload[field] === "false" || payload[field] === false || payload[field] === 0 || payload[field] === "0") {
          payload[field] = false;
        } else if (payload[field] === "" || payload[field] === null) {
          delete payload[field];
        }
      }
    });

    // Sanitize number fields
    if (payload.sessionTimeoutMinutes !== undefined) {
      if (payload.sessionTimeoutMinutes === "" || payload.sessionTimeoutMinutes === null) {
        delete payload.sessionTimeoutMinutes;
      } else {
        const parsed = Number(payload.sessionTimeoutMinutes);
        if (!isNaN(parsed)) {
          payload.sessionTimeoutMinutes = parsed;
        } else {
          delete payload.sessionTimeoutMinutes;
        }
      }
    }

    let settings = await GeneralSettings.findOne();
    if (settings) {
      settings = await GeneralSettings.findByIdAndUpdate(settings._id, payload, { new: true, runValidators: true });
    } else {
      payload.businessType = req.user.businessType;
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
router.get("/get", auth, dbSelector, async (req, res, next) => {
  const { GeneralSettings } = req.models;
  try {
    const settings = await GeneralSettings.findOne();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

/**
 * Public GET for login page (no auth)
 */
router.get("/public", async (req, res, next) => {
  try {
    // Default to 'agro' if no type provided, or use query param
    const type = req.query.type || 'agro';
    const connection = getConnection(type);
    const models = getModels(connection);
    
    if (!models) {
      return res.status(200).json({ success: true, data: { pharmacyName: "Vendharaa Billing", logo: null } });
    }

    const settings = await models.GeneralSettings.findOne();
    if (!settings) {
      return res.status(200).json({ success: true, data: { pharmacyName: type === 'pharma' ? "Pharma Billing" : "Agro Billing", logo: null } });
    }

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
