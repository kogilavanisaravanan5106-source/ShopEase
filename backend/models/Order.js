
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    customer: {
      fullName: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    
paymentMethod: {
  type: String,
  enum: ["online", "cod"],
  required: true,
},

paymentStatus: {
  type: String,
  enum: ["Pending", "Paid", "Failed", "Pay on Delivery"],
  default: "Pending",
},

razorpayOrderId: {
  type: String,
  default: null,
},

razorpayPaymentId: {
  type: String,
  default: null,
},

status: {
  type: String,
  enum: ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"],
  default: "Placed",
},
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
