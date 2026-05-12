const { logServerError } = require("../utils/logger");

/**
 * Global Error Handling Middleware
 * Catch all unhandled errors, log them, and return a unique tracking code to the client.
 */
const errorHandler = (err, req, res, next) => {
  // If headers already sent, delegate to default express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Log the error and get a unique tracking code
  const errorCode = logServerError(err, req);

  // Return a generic response with the tracking ID
  res.status(err.status || 500).json({
    success: false,
    message: "A server-side error occurred",
    errorCode: errorCode,
    // We intentionally hide the raw error message and stack in production-like outputs
    // But for this project, we'll keep the message brief.
  });
};

module.exports = errorHandler;
