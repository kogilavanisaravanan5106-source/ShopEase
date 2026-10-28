
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const Order = require("../models/Order");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");

// Create a Razorpay payment order
router.post("/create-order", authMiddleware, async (req, res) => {
  try {
    const { customer, items } = req.body;

    if (
      !customer ||
      !customer.fullName ||
      !customer.phone ||
      !customer.address ||
      !customer.city ||
      !customer.pincode ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all customer details and cart items.",
      });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Razorpay configuration is missing.",
      });
    }

    const quantitiesAreValid = items.every(
      (item) =>
        mongoose.isValidObjectId(item.productId) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= 100
    );

    if (!quantitiesAreValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart items or quantities.",
      });
    }

    const productIds = items.map((item) => item.productId);

    if (new Set(productIds.map(String)).size !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate cart items are not allowed.",
      });
    }

    const products = await Product.find({
      _id: { $in: productIds },
    });

    if (products.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products could not be found.",
      });
    }

    const productMap = new Map(
      products.map((product) => [String(product._id), product])
    );

    const orderItems = items.map((item) => {
      const product = productMap.get(String(item.productId));

      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      };
    });

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount.",
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `shop_${new mongoose.Types.ObjectId()}`,
    });

    const order = await Order.create({
      user: req.user.userId,
      customer,
      items: orderItems,
      totalAmount,
      paymentMethod: "online",
      paymentStatus: "Pending",
      razorpayOrderId: razorpayOrder.id,
    });

    return res.status(201).json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      razorpayOrderId: razorpayOrder.id,
      shopOrderId: order._id,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to start online payment.",
    });
  }
});

// Verify payment signature
router.post("/verify", authMiddleware, async (req, res) => {
  try {
    const {
      shopOrderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !mongoose.isValidObjectId(shopOrderId) ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are incomplete.",
      });
    }

    const order = await Order.findOne({
      _id: shopOrderId,
      user: req.user.userId,
      razorpayOrderId: razorpay_order_id,
      paymentMethod: "online",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(200).json({
        success: true,
        message: "Payment was already verified.",
        order,
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(razorpay_signature);

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed.",
      });
    }

    order.razorpayPaymentId = razorpay_payment_id;
    order.paymentStatus = "Paid";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully!",
      order,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to verify payment.",
    });
  }
});

module.exports = router;
