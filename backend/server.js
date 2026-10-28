
const express = require("express");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const cors = require("cors");
require("dotenv").config();

const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const Product = require("./models/Product");

mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shopease")
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((error) => console.error("MongoDB connection error:", error));

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to ShopEase API!");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "ShopEase backend is running!"
  });
});

const products = [
  {
    id: 1,
    name: "Classic White Sneakers",
    category: "Footwear",
    price: 1499,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
  },
  {
    id: 2,
    name: "Everyday Backpack",
    category: "Accessories",
    price: 999,
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
  },
  {
    id: 3,
    name: "Minimal Wrist Watch",
    category: "Accessories",
    price: 2199,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
  },
  
  {
    id: 4,
    name: "Wireless Headphones",
    category: "Electronics",
    price: 1799,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
  },
  {
    id: 5,
    name: "Cotton Casual T-Shirt",
    category: "Fashion",
    price: 599,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
  },
  {
    id: 6,
    name: "Classic Denim Jacket",
    category: "Fashion",
    price: 1899,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600",
  },
  {
    id: 7,
    name: "Running Shoes",
    category: "Footwear",
    price: 2299,
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
  },
  {
    id: 8,
    name: "Everyday Sunglasses",
    category: "Accessories",
    price: 799,
    rating: 4.3,
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600",
  },
  {
    id: 9,
    name: "Portable Bluetooth Speaker",
    category: "Electronics",
    price: 1499,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600",
  },
  {
    id: 10,
    name: "Desk Table Lamp",
    category: "Home & Kitchen",
    price: 999,
    rating: 4.4,
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600",
  },
  {
    id: 11,
    name: "Ceramic Coffee Mug",
    category: "Home & Kitchen",
    price: 349,
    rating: 4.2,
    image:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600",
  },
  {
    id: 12,
    name: "Daily Face Moisturizer",
    category: "Beauty",
    price: 499,
    rating: 4.4,
    image:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600",
  },
  
  {
    id: 13,
    name: "Canvas Casual Shoes",
    category: "Footwear",
    price: 1299,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600",
  },
  {
    id: 14,
    name: "Sports Running Sneakers",
    category: "Footwear",
    price: 2499,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600",
  },
  {
    id: 15,
    name: "Leather Wallet",
    category: "Accessories",
    price: 699,
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600",
  },
  

{
  id: 16,
  name: "Women's Floral Summer Dress",
  category: "Women's Clothing",
  price: 899,
  rating: 4.6,
  image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80",
},


  {
    id: 17,
    name: "Wireless Earbuds",
    category: "Electronics",
    price: 1999,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600",
  },
  {
    id: 18,
    name: "Smart Watch",
    category: "Electronics",
    price: 2999,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600",
  },
  {
    id: 19,
    name: "Oversized Cotton T-Shirt",
    category: "Fashion",
    price: 699,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
  },
  {
    id: 20,
    name: "Casual Denim Jeans",
    category: "Fashion",
    price: 1499,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600",
  },
  {
    id: 21,
    name: "Hooded Sweatshirt",
    category: "Fashion",
    price: 1299,
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600",
  },
  {
    id: 22,
    name: "Decorative Table Lamp",
    category: "Home & Kitchen",
    price: 1199,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600",
  },
  {
    id: 23,
    name: "Reusable Water Bottle",
    category: "Home & Kitchen",
    price: 399,
    rating: 4.3,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600",
  },
  {
    id: 24,
    name: "Ceramic Plant Pot",
    category: "Home & Kitchen",
    price: 599,
    rating: 4.2,
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600",
  },
  {
    id: 25,
    name: "Daily Face Cleanser",
    category: "Beauty",
    price: 349,
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=600",
  },
  {
    id: 26,
    name: "Skin Care Cream",
    category: "Beauty",
    price: 549,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600",
  },
  {
    id: 27,
    name: "Polarized Sunglasses",
    category: "Accessories",
    price: 899,
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600",
  },
  {
    id: 28,
    name: "Portable Bluetooth Speaker",
    category: "Electronics",
    price: 1599,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600",
  },
  {
    id: 29,
    name: "Everyday Travel Backpack",
    category: "Accessories",
    price: 1099,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=600",
  },
  {
    id: 30,
    name: "Minimal Ceramic Mug",
    category: "Home & Kitchen",
    price: 299,
    rating: 4.2,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600",
  },

];



app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});


app.post("/api/products/seed", async (req, res) => {
  try {
    await Product.deleteMany({});
    const savedProducts = await Product.insertMany(products);

    res.json({
      success: true,
      message: "Products added to MongoDB successfully!",
      count: savedProducts.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add products",
      error: error.message,
    });
  }
});



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`ShopEase server running on port ${PORT}`);
});
