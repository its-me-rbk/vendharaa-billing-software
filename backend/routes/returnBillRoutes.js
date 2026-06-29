const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const dbSelector = require("../middleware/dbSelector");

router.use(auth);
router.use(dbSelector);

/**
 * @route   POST /api/return-bills
 * @desc    Create a Return Bill and adjust stock & accounts ledger
 */
router.post("/", async (req, res, next) => {
  const { Product, Bill, Ledger, Account, ReturnBill } = req.models;
  const businessType = req.user.businessType;

  // This feature is pharmaceutical exclusive
  if (businessType !== "pharma") {
    return res.status(403).json({
      success: false,
      message: "Sales returns are only supported for the pharmaceutical business unit",
    });
  }

  try {
    const {
      originalBillId,
      returnedItems,
      replacementItems,
      returnedAmount,
      replacementAmount,
      refundAmount,
      extraCharged,
      accountId,
    } = req.body;

    if (!originalBillId || !Array.isArray(returnedItems) || returnedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Original bill ID and returned items are required",
      });
    }

    // Verify original bill
    const originalBill = await Bill.findById(originalBillId);
    if (!originalBill) {
      return res.status(404).json({
        success: false,
        message: "Original invoice not found",
      });
    }

    // Verify selected account
    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(400).json({
        success: false,
        message: "Valid settlement account is required",
      });
    }

    // Generate unique return bill invoice number
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const returnInvoiceNumber = `RET-${dateStr}-${randomSuffix}`;

    // 1. Process Returned Items
    for (const item of returnedItems) {
      const originalProduct = await Product.findById(item.productId);

      if (item.reason === "Others") {
        // Undamaged Return: Restore directly to original active product batch
        if (originalProduct) {
          if (item.batchNumber) {
            const batch = originalProduct.batches.find(
              (b) => b.batchNumber === item.batchNumber
            );
            if (batch) {
              batch.quantity += Number(item.qty);
            } else {
              originalProduct.batches.push({
                batchNumber: item.batchNumber,
                expiryDate: item.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                quantity: Number(item.qty),
              });
            }
          }
          originalProduct.quantity += Number(item.qty);
          await originalProduct.save();
        }
      } else {
        // Damaged/Expired/Near Expiry Return:
        // Do NOT restore to active sellable stock. Record under "Returned Products" category with reason.
        let returnedProduct = await Product.findOne({
          name: item.name,
          category: "Returned Products",
          returnReason: item.reason,
        });

        if (returnedProduct) {
          // Increment existing returned product
          if (item.batchNumber) {
            const batch = returnedProduct.batches.find(
              (b) => b.batchNumber === item.batchNumber
            );
            if (batch) {
              batch.quantity += Number(item.qty);
            } else {
              returnedProduct.batches.push({
                batchNumber: item.batchNumber,
                expiryDate: item.expiryDate || new Date(),
                quantity: Number(item.qty),
              });
            }
          }
          returnedProduct.quantity += Number(item.qty);
          await returnedProduct.save();
        } else {
          // Create new returned product entry
          await Product.create({
            name: item.name,
            businessType: "pharma",
            category: "Returned Products",
            manufacturer: originalProduct ? originalProduct.manufacturer : "Returned Manufacturer",
            price: Number(item.price) || 0,
            gst: Number(item.gst) || 0,
            quantity: Number(item.qty),
            returnReason: item.reason,
            batches: [
              {
                batchNumber: item.batchNumber || "RET-BATCH",
                expiryDate: item.expiryDate || new Date(),
                quantity: Number(item.qty),
              },
            ],
          });
        }
      }
    }

    // 2. Process Replacement Items (Deduct Stock)
    if (Array.isArray(replacementItems) && replacementItems.length > 0) {
      for (const item of replacementItems) {
        const replacementProduct = await Product.findById(item.productId);
        if (!replacementProduct) {
          return res.status(404).json({
            success: false,
            message: `Replacement product "${item.name}" not found in inventory`,
          });
        }

        const totalToDeduct = Number(item.qty) || 0;

        if (item.batchNumber) {
          const batch = replacementProduct.batches.find(
            (b) => b.batchNumber === item.batchNumber
          );
          if (!batch || batch.quantity < totalToDeduct) {
            return res.status(400).json({
              success: false,
              message: `Not enough stock in batch "${item.batchNumber}" for replacement medicine "${item.name}"`,
            });
          }
          batch.quantity -= totalToDeduct;
        } else {
          if (replacementProduct.quantity < totalToDeduct) {
            return res.status(400).json({
              success: false,
              message: `Not enough stock for replacement medicine "${item.name}"`,
            });
          }
        }
        replacementProduct.quantity -= totalToDeduct;
        await replacementProduct.save();
      }
    }

    // Create the Return Bill Document
    const returnBill = await ReturnBill.create({
      returnInvoiceNumber,
      originalBillId,
      originalInvoiceNumber: originalBill.invoice,
      customerName: originalBill.customerName,
      customerPhone: originalBill.customerPhone,
      returnedItems,
      replacementItems: replacementItems || [],
      returnedAmount: Number(returnedAmount) || 0,
      replacementAmount: Number(replacementAmount) || 0,
      refundAmount: Number(refundAmount) || 0,
      extraCharged: Number(extraCharged) || 0,
      accountId: account._id,
      accountName: account.name,
      businessType: "pharma",
    });

    // 3. Ledger Integrations
    // Refund due to customer: Debit Expense/Outflow
    if (Number(refundAmount) > 0) {
      await Ledger.create({
        date: new Date(),
        description: `Refund for Return Bill #${returnInvoiceNumber} [Original Inv: #${originalBill.invoice}]`,
        type: "debit",
        amount: Number(refundAmount),
        category: "Sales",
        paymentMethod: account.type || "Cash",
        partyName: originalBill.customerName || "Walk-in Customer",
        referenceId: returnBill._id,
        referenceType: "Bill",
        accountId: account._id,
        accountName: account.name,
        businessType: "pharma",
      });
    }

    // Extra amount collected from customer: Credit Income/Inflow
    if (Number(extraCharged) > 0) {
      await Ledger.create({
        date: new Date(),
        description: `Extra collected for Return Bill #${returnInvoiceNumber} [Original Inv: #${originalBill.invoice}]`,
        type: "credit",
        amount: Number(extraCharged),
        category: "Sales",
        paymentMethod: account.type || "Cash",
        partyName: originalBill.customerName || "Walk-in Customer",
        referenceId: returnBill._id,
        referenceType: "Bill",
        accountId: account._id,
        accountName: account.name,
        businessType: "pharma",
      });
    }

    res.status(201).json({
      success: true,
      message: "Return Bill processed successfully",
      data: returnBill,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/return-bills
 * @desc    Get all return bills
 */
router.get("/", async (req, res, next) => {
  const { ReturnBill } = req.models;
  const businessType = req.user.businessType;

  // Let superadmin override business via header if needed
  let targetBusiness = businessType;
  if (req.user.role === "superadmin" && req.headers["x-business-type"]) {
    targetBusiness = req.headers["x-business-type"];
  }

  try {
    const returnBills = await ReturnBill.find({ businessType: targetBusiness }).sort({
      createdAt: -1,
    });
    res.status(200).json({
      success: true,
      data: returnBills,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/return-bills/:id
 * @desc    Get return bill by ID
 */
router.get("/:id", async (req, res, next) => {
  const { ReturnBill } = req.models;
  try {
    const returnBill = await ReturnBill.findById(req.params.id);
    if (!returnBill) {
      return res.status(404).json({
        success: false,
        message: "Return Bill not found",
      });
    }
    res.status(200).json({
      success: true,
      data: returnBill,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
