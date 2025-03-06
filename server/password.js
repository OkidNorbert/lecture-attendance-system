const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User"); // Adjust path if needed
require("dotenv").config();

async function resetAdminPassword() {
  await mongoose.connect(process.env.MONGO_URI);

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("admin#6", salt);

  const result = await User.findOneAndUpdate(
    { role: "admin" },
    { password: hashedPassword },
    { new: true }
  );

  console.log("✅ Admin password updated:", result);

  mongoose.disconnect();
}

resetAdminPassword();
