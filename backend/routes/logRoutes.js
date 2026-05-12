const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

/**
 * @route   POST /api/logs/error
 * @desc    Log frontend errors to a server-side file
 * @access  Public (so we can log errors from anywhere)
 */
router.post("/error", (req, res) => {
  try {
    const errorData = req.body;
    
    // Validate that we have at least a tracking code
    if (!errorData || !errorData.code) {
      return res.status(400).json({ success: false, message: "Invalid error data" });
    }

    const logDir = path.join(__dirname, "../logs");
    const logFile = path.join(logDir, "errors.log");

    // Ensure logs directory exists (backup check)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logEntry = {
      serverTimestamp: new Date().toISOString(),
      ...errorData
    };

    // Append to log file as JSON-L (one JSON object per line)
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n");

    console.log(`[Backend Log] Error logged with code: ${errorData.code}`);

    res.status(200).json({ success: true, message: "Error logged to server" });
  } catch (err) {
    console.error("Failed to write to error log file:", err.message);
    res.status(500).json({ success: false, message: "Internal server error during logging" });
  }
});

/**
 * @route   GET /api/logs/test-crash
 * @desc    Test endpoint to trigger a server-side error
 */
router.get("/test-crash", (req, res) => {
  throw new Error("Intentional Backend Crash: Verification test for tracking system");
});

module.exports = router;
