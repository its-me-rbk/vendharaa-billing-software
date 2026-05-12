const fs = require("fs");
const path = require("path");

/**
 * Generates a unique, server-side error tracking code.
 * Format: SRV-[TIMESTAMP]-[RANDOM]
 */
const generateErrorCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SRV-${timestamp}-${randomStr}`;
};

/**
 * Logs a backend error with a unique tracking code.
 * 
 * @param {Error} error The catch error object.
 * @param {Object} req The express request object (for context).
 * @param {Object} extra Additional context details.
 * @returns {string} The unique tracking code generated for this error.
 */
const logServerError = (error, req = null, extra = {}) => {
  const code = generateErrorCode();
  const logDir = path.join(__dirname, "../logs");
  const logFile = path.join(logDir, "errors.log");

  // Ensure logs directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logEntry = {
    code,
    type: 'server_error',
    message: error.message || String(error),
    stack: error.stack,
    timestamp: new Date().toISOString(),
    path: req ? req.originalUrl : extra.path,
    method: req ? req.method : extra.method,
    ip: req ? req.ip : extra.ip,
    ...extra
  };

  // Append to log file
  fs.appendFileSync(logFile, JSON.stringify(logEntry) + "\n");

  console.error(`[Server Error Logged] Tracking Code: ${code} | Path: ${logEntry.path}`);

  return code;
};

module.exports = { logServerError };
