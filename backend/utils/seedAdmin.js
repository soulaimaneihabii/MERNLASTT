import dotenv from "dotenv"
import connectDB from "../config/database.js"
import User from "../models/User.model.js"

// Load environment variables
dotenv.config()

const seedAdmin = async () => {
  try {
    // Connect to database
    await connectDB()

    // Check if admin already exists
    const adminExists = await User.findOne({ role: "admin" })

    if (adminExists) {
      console.log("❌ Admin user already exists")
      console.log(`📧 Email: ${adminExists.email}`)
      process.exit(0)
    }

    // Create admin user
    const adminData = {
      name: "System Administrator",
      email: process.env.ADMIN_EMAIL || "admin@medical-app.com",
      password: process.env.ADMIN_PASSWORD || "Admin123!",
      role: "admin",
      department: "Administration",
      isActive: true,
      isEmailVerified: true,
    }

    const admin = await User.create(adminData)

    console.log("✅ Admin user created successfully!")
    console.log(`📧 Email: ${admin.email}`)
    console.log(`🔑 Password: ${adminData.password}`)
    console.log(`👤 Role: ${admin.role}`)
    console.log(`🆔 ID: ${admin._id}`)
    console.log("\n⚠️  Please change the default password after first login!")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message)
    process.exit(1)
  }
}

// Run the seeder
seedAdmin()
