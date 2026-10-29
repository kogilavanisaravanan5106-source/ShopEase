const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);


const mongoose = require("mongoose");
require("dotenv").config();

const Product = require("./models/Product");

const products = [
  {
    name: "Running Sports Shoes",
    category: "Footwear",
    price: 1899,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
  },
  {
    name: "Casual Canvas Shoes",
    category: "Footwear",
    price: 1199,
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600",
  },
  {
    name: "Leather Formal Shoes",
    category: "Footwear",
    price: 2499,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600",
  },
  {
    name: "Travel Duffel Bag",
    category: "Accessories",
    price: 1499,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
  },
  {
    name: "Classic Leather Wallet",
    category: "Accessories",
    price: 699,
    rating: 4.3,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600",
  },
  {
    name: "Stylish Sunglasses",
    category: "Accessories",
    price: 899,
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600",
  },
  {
    name: "Classic Analog Watch",
    category: "Accessories",
    price: 1999,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600",
  },
  {
    name: "Bluetooth Earbuds",
    category: "Electronics",
    price: 1299,
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600",
  },
  {
    name: "Portable Bluetooth Speaker",
    category: "Electronics",
    price: 1599,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600",
  },
  {
    name: "Wireless Computer Mouse",
    category: "Electronics",
    price: 599,
    rating: 4.3,
    image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=600",
  },
  {
    name: "Mechanical Gaming Keyboard",
    category: "Electronics",
    price: 2299,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600",
  },
  {
    name: "Classic Cotton T-Shirt",
    category: "Fashion",
    price: 499,
    rating: 4.2,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
  },
  {
    name: "Denim Jacket",
    category: "Fashion",
    price: 1799,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600",
  },
  {
    name: "Everyday Hoodie",
    category: "Fashion",
    price: 1299,
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600",
  },
  {
    name: "Casual Backpack",
    category: "Accessories",
    price: 1099,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=600",
  },
  {
    name: "Ceramic Coffee Mug",
    category: "Home & Kitchen",
    price: 299,
    rating: 4.3,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600",
  },
  {
    name: "Stainless Steel Water Bottle",
    category: "Home & Kitchen",
    price: 449,
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600",
  },
  {
    name: "Decorative Table Lamp",
    category: "Home & Kitchen",
    price: 999,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600",
  },
  {
    name: "Soft Cushion Set",
    category: "Home & Kitchen",
    price: 799,
    rating: 4.3,
    image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600",
  },
  {
    name: "Minimal Wall Clock",
    category: "Home & Kitchen",
    price: 699,
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=600",
  },
  {
    name: "Gentle Face Cleanser",
    category: "Beauty",
    price: 349,
    rating: 4.2,
    image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=600",
  },
  {
    name: "Daily Moisturizer",
    category: "Beauty",
    price: 499,
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600",
  },
  {
    name: "Skincare Serum",
    category: "Beauty",
    price: 599,
    rating: 4.3,
    image: "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600",
  },
  {
    name: "Travel Makeup Pouch",
    category: "Beauty",
    price: 399,
    rating: 4.2,
    image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600",
  },
  {
    name: "Polarized Sports Sunglasses",
    category: "Accessories",
    price: 1199,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600",
  },
  {
    name: "Premium Over-Ear Headphones",
    category: "Electronics",
    price: 2799,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
  },
];

async function seedProducts() {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI is missing from backend/.env");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB Atlas!");

    let added = 0;
    let skipped = 0;

    for (const product of products) {
      const result = await Product.updateOne(
        { name: product.name },
        { $setOnInsert: product },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        added++;
      } else {
        skipped++;
      }
    }

    const total = await Product.countDocuments();

    console.log(`New products added: ${added}`);
    console.log(`Existing products skipped: ${skipped}`);
    console.log(`Total products in database: ${total}`);
  } catch (error) {
    console.error("Seeding failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedProducts();
