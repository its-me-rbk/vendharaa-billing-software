const ActivityLog = require("../models/ActivityLog");
const User = require("../models/usermodel");
const path = require("path");

const getLogDescription = (req) => {
  const method = req.method;
  const url = req.originalUrl;
  const parts = url.split("/");
  const resource = parts[2]?.toLowerCase();
  const id = parts[3];
  const subResource = parts[4]?.toLowerCase();

  const name = req.body?.name || req.body?.customerName || req.body?.productName || "";
  const nameStr = name ? ` "${name}"` : "";

  switch (resource) {
    case "users":
      if (url.includes("/login")) return "Logged into the system";
      if (url.includes("/logout")) return "Logged out of the system";
      if (method === "POST" && url.includes("/add")) return `Invited new user${nameStr}`;
      if (method === "PUT") return `Updated user account${nameStr}`;
      if (method === "DELETE") return "Deleted a user account";
      break;
    case "products":
      if (method === "POST" && subResource === "batches") return `Added new batch to product${nameStr}`;
      if (method === "POST") return `Created new product${nameStr}`;
      if (method === "PUT") return `Updated product details${nameStr}`;
      if (method === "DELETE") return `Deleted product${nameStr}`;
      break;
    case "bills":
      if (method === "POST" && subResource === "payments") return `Recorded payment for bill #${id}`;
      if (method === "POST") return `Generated new bill${req.body?.invoice ? ` #${req.body.invoice}` : ""}`;
      if (method === "DELETE") return `Cancelled/Deleted bill #${id}`;
      break;
    case "customers":
      if (method === "POST") return `Added new customer${nameStr}`;
      if (method === "PUT") return `Updated customer info${nameStr}`;
      break;
    case "suppliers":
      if (method === "POST") return `Added new supplier${nameStr}`;
      if (method === "PUT") return `Updated supplier info${nameStr}`;
      break;
  }

  return `${method} ${url}`;
};

const activityLogger = async (req, res, next) => {
  // Only log state-changing requests or specific important ones
  const loggedMethods = ["POST", "PUT", "DELETE", "PATCH"];
  
  // Capture the original res.send to log after the request is finished
  const originalSend = res.send;
  
  res.send = function (body) {
    res.send = originalSend; // Restore it
    
    // Process log in background after response is sent
    if (loggedMethods.includes(req.method) && req.user) {
      try {
        const responseData = JSON.parse(body);
        
        // Don't log if the request failed (optional, but usually we want to log attempts too)
        // For now, only log successful changes
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const logEntry = new ActivityLog({
            user: {
              id: req.user.id,
              name: req.user.name || "Unknown",
              email: req.user.email || "Unknown",
              role: req.user.role || "Unknown",
            },
            action: `${req.method}_${req.originalUrl.split("/")[2]?.toUpperCase() || "UNKNOWN"}`,
            description: getLogDescription(req),
            method: req.method,
            endpoint: req.originalUrl,
            businessType: req.user.businessType || "unknown",
            details: {
              body: req.body,
              // Optionally filter sensitive fields like passwords
            },
            ip: req.ip,
            userAgent: req.get("User-Agent"),
          });
          
          // Scrub sensitive data
          if (logEntry.details.body && logEntry.details.body.password) {
            logEntry.details.body.password = "********";
          }

          logEntry.save().catch(err => console.error("Logger Error:", err));
        }
      } catch (err) {
        // Body might not be JSON or other errors
      }
    }
    
    return originalSend.call(this, body);
  };

  next();
};

module.exports = activityLogger;
