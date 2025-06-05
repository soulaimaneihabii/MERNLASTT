import dotenv from "dotenv"
import connectDB from "../config/database.js"
import User from "../models/User.model.js"
import readline from "readline"

// Load environment variables
dotenv.config()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

const createAdmin = async () => {
  try {
    // Connect to database
    await connectDB()

    console.log("🔧 Creating Admin User")
    console.log("=" * 30)

    // Get admin details
    const name = (await question("Enter admin name (default: System Administrator): ")) || "System Administrator"
    const email = (await question("Enter admin email (default: admin@medical-app.com): ")) || "admin@medical-app.com"
    const password = (await question("Enter admin password (default: Admin123!): ")) || "Admin123!"
    const department = (await question("Enter department (default: Administration): ")) || "Administration"

    // Check if admin already exists
    const adminExists = await User.findOne({ email })

    if (adminExists) {
      console.log("❌ User with this email already exists")
      console.log(`📧 Email: ${adminExists.email}`)
      console.log(`👤 Role: ${adminExists.role}`)

      const overwrite = await question("Do you want to update this user to admin? (y/N): ")

      if (overwrite.toLowerCase() === "y") {
        adminExists.role = "admin"
        adminExists.isActive = true
        adminExists.isEmailVerified = true
        await adminExists.save()

        console.log("✅ User updated to admin successfully!")
        console.log(`📧 Email: ${adminExists.email}`)
        console.log(`👤 Role: ${adminExists.role}`)
      }

      rl.close()
      process.exit(0)
    }

    // Create admin user
    const adminData = {
      name,
      email,
      password,
      role: "admin",
      department,
      isActive: true,
      isEmailVerified: true,
    }

    const admin = await User.create(adminData)

    console.log("\n✅ Admin user created successfully!")
    console.log("=" * 40)
    console.log(`👤 Name: ${admin.name}`)
    console.log(`📧 Email: ${admin.email}`)
    console.log(`🔑 Password: ${password}`)
    console.log(`👔 Role: ${admin.role}`)
    console.log(`🏢 Department: ${admin.department}`)
    console.log(`🆔 ID: ${admin._id}`)
    console.log("\n⚠️  Please change the password after first login!")
    console.log("🔗 Login at: http://localhost:5000/api/auth/login")

    rl.close()
    process.exit(0)
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message)
    rl.close()
    process.exit(1)
  }
}

// Run the creator
createAdmin()
