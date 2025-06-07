import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

mongoose.connect("mongodb+srv://soulayemane3:12345678Aa@cluster0.ndrdvsm.mongodb.net/MERN_APP_LATEST?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const resetAdminPassword = async () => {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await User.updateOne(
    { email: "admin@gmail.com" },
    { $set: { password: hashedPassword, loginAttempts: 0 } }
  );

  console.log("✅ Admin password reset to 'admin123'");
  mongoose.disconnect();
};

resetAdminPassword();
