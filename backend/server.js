
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
// Serve uploaded files (logos, settings, etc.)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* Database */
connectDB().then(() => {
  startCronJobs();
  console.log("⏰ Cron Jobs Started");
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

/* Global Error Handler (Must be after all routes) */
const errorHandler = require("./middleware/errorMiddleware");
app.use(errorHandler);

/* Root */
app.get("/", (req, res) => {
  res.send("API is running...");
});

/* Server */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
