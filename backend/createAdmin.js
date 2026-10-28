
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createAdmin() {
  try {
    await mongoose.connect(
      "mongodb://127.0.0.1:27017/shopease"
    );

    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password || password.length < 12) {
      throw new Error(
        "Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters in .env."
      );
    }

    const existingUser = await User.findOne({ email });


    if (existingUser) {
      existingUser.role = "admin";
      existingUser.password = await bcrypt.hash(password, 12);

      await existingUser.save();

      console.log("Existing admin account and password updated successfully.");
    } else {

      const hashedPassword = await bcrypt.hash(password, 12);

      await User.create({
        name: "ShopEase Admin",
        email,
        password: hashedPassword,
        role: "admin",
      });

      console.log("Admin account created successfully.");
    }
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
