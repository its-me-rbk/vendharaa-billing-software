
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();
const { connectDB } = require("./config/db");
const app = express();
const startCronJobs = require("./utils/cronJobs");

/* Middleware */
app.use(cors());
app.use(express.json());
const activityLogger = require("./middleware/logger");
app.use(activityLogger);

/* Database */
connectDB().then(async () => {
  startCronJobs();
  console.log("⏰ Cron Jobs Started");

  // Dynamic Account Seeder
  try {
    const { connections, getModels } = require("./config/db");
    const businesses = ["agro", "pharma"];
    for (const b of businesses) {
      const conn = connections[b];
      if (conn) {
        const models = getModels(conn);
        if (models && models.Account) {
          const cashExists = await models.Account.findOne({ name: "Cash", businessType: b });
          if (!cashExists) {
            await models.Account.create({
              name: "Cash",
              type: "Cash",
              description: "Default physical cash account",
              initialBalance: 0,
              businessType: b
            });
            console.log(`✅ Default Cash account seeded for ${b}`);
          }
          const bankExists = await models.Account.findOne({ name: "General Bank", businessType: b });
          if (!bankExists) {
            await models.Account.create({
              name: "General Bank",
              type: "Bank",
              description: "Default general bank account",
              initialBalance: 0,
              businessType: b
            });
            console.log(`✅ Default General Bank account seeded for ${b}`);
          }
        }
      }
    }
  } catch (err) {
    console.error("❌ Failed to run accounts startup seeder:", err.message);
  }
});

/* Routes */
// Use specific routers. Middlewares are applied inside each router for flexibility.
app.use("/api/users", require("./routes/user_routes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/bills", require("./routes/BillRoutes"));
app.use("/api/customers", require("./routes/Customer"));
app.use("/api/suppliers", require("./routes/SupplierRoutes"));
app.use("/api/general-settings", require("./routes/generalSettings_routes"));
app.use("/api/logs", require("./routes/logRoutes"));
app.use("/api/super-admin", require("./routes/superAdminRoutes"));
app.use("/api/ledger", require("./routes/ledgerRoutes"));
app.use("/api/accounts", require("./routes/accountRoutes"));
app.use("/api/return-bills", require("./routes/returnBillRoutes"));

/* Global Error Handler (Must be after all routes) */
const errorHandler = require("./middleware/errorMiddleware");
app.use(errorHandler);

/* Root */
app.get("/", (req, res) => {
  res.send("API is running...");
});

/* Server */
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
