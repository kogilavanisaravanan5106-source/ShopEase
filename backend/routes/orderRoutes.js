
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Order = require("../models/Order");
const authMiddleware = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/authMiddleware");

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { customer, items, paymentMethod } = req.body;

    if (
      !customer ||
      !customer.fullName ||
      !customer.phone ||
      !customer.address ||
      !customer.city ||
      !customer.pincode ||
      !["online", "cod"].includes(paymentMethod) ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all customer details and cart items.",
      });
    }

    const validItems = items.every(
      (item) =>
        mongoose.isValidObjectId(item.productId) &&
        typeof item.name === "string" &&
        Number.isFinite(item.price) &&
        item.price >= 0 &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    );

    if (!validItems) {
      return res.status(400).json({
        success: false,
        message: "The cart contains invalid product details.",
      });
    }

    const calculatedTotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const order = await Order.create({
      user: req.user.userId,
      customer,
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      totalAmount: calculatedTotal,
      paymentMethod,
      paymentStatus:
        paymentMethod === "cod" ? "Pay on Delivery" : "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Order saved successfully!",
      order,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to save the order.",
    });
  }
});


router.patch("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.status !== "Placed") {
      return res.status(400).json({
        success: false,
        message: "Only placed orders can be cancelled.",
      });
    }

    order.status = "Cancelled";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully!",
      order,
    });
  } catch (error) {
    console.error("Order cancellation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel the order.",
    });
  }
});


router.get("/", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Fetch orders error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch orders.",
    });
  }
});


router.get("/admin/all", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Admin fetch orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch all orders.",
    });
  }
});


router.patch(
  "/admin/:id/status",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const allowedStatuses = [
        "Placed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
      ];

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order ID.",
        });
      }

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status.",
        });
      }

      const order = await Order.findById(id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      if (order.status === "Cancelled" || order.status === "Delivered") {
        return res.status(400).json({
          success: false,
          message: "Cancelled or delivered orders cannot be changed.",
        });
      }

      order.status = status;
      await order.save();

      return res.status(200).json({
        success: true,
        message: "Order status updated successfully!",
        order,
      });
    } catch (error) {
      console.error("Admin update status error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update order status.",
      });
    }
  }
);


module.exports = router;
