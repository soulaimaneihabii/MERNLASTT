import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

const API_URL = process.env.API_URL || "http://localhost:3001"

class APITester {
  constructor() {
    this.token = null
    this.userId = null
    this.patientId = null
  }

  async testHealthCheck() {
    try {
      console.log("🔍 Testing health check...")
      const response = await axios.get(`${API_URL}/health`)
      console.log("✅ Health check passed:", response.data.message)
      return true
    } catch (error) {
      console.error("❌ Health check failed:", error.message)
      return false
    }
  }

  async testLogin() {
    try {
      console.log("🔍 Testing login...")
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email: process.env.ADMIN_EMAIL || "admin@medical-app.com",
        password: process.env.ADMIN_PASSWORD || "Admin123!",
      })

      this.token = response.data.token
      this.userId = response.data.data._id

      console.log("✅ Login successful")
      console.log(`🔑 Token received: ${this.token.substring(0, 20)}...`)
      return true
    } catch (error) {
      console.error("❌ Login failed:", error.response?.data?.message || error.message)
      return false
    }
  }

  async testTokenVerification() {
    try {
      console.log("🔍 Testing token verification...")
      const response = await axios.get(`${API_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${this.token}` },
      })

      console.log("✅ Token verification successful")
      console.log(`👤 User: ${response.data.data.name}`)
      return true
    } catch (error) {
      console.error("❌ Token verification failed:", error.response?.data?.message || error.message)
      return false
    }
  }

  async testCreateDoctor() {
    try {
      console.log("🔍 Testing doctor creation...")
      const doctorData = {
        name: "Dr. John Smith",
        email: "doctor@medical-app.com",
        password: "Doctor123!",
        role: "doctor",
        specialization: "Cardiology",
        licenseNumber: "MD123456",
        phone: "1234567890",
        department: "Cardiology",
      }

      const response = await axios.post(`${API_URL}/api/users`, doctorData, {
        headers: { Authorization: `Bearer ${this.token}` },
      })

      console.log("✅ Doctor created successfully")
      console.log(`👨‍⚕️ Doctor: ${response.data.data.name}`)
      return true
    } catch (error) {
      console.error("❌ Doctor creation failed:", error.response?.data?.message || error.message)
      return false
    }
  }

  async testCreatePatient() {
    try {
      console.log("🔍 Testing patient creation...")
      const patientData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "1234567890",
        dateOfBirth: "1980-01-01",
        age: 44,
        gender: "Male",
        race: "Caucasian",
        diag_1: "E11.9",
        time_in_hospital: 3,
        num_lab_procedures: 5,
        num_procedures: 1,
        num_medications: 10,
        number_outpatient: 2,
        number_emergency: 0,
        number_inpatient: 1,
        number_diagnoses: 3,
        address: {
          street: "123 Main St",
          city: "Anytown",
          state: "CA",
          zipCode: "12345",
        },
        emergencyContact: {
          name: "Jane Doe",
          relationship: "Spouse",
          phone: "0987654321",
        },
      }

      const response = await axios.post(`${API_URL}/api/patients`, patientData, {
        headers: { Authorization: `Bearer ${this.token}` },
      })

      this.patientId = response.data.data._id
      console.log("✅ Patient created successfully")
      console.log(`🏥 Patient: ${response.data.data.fullName}`)
      return true
    } catch (error) {
      console.error("❌ Patient creation failed:", error.response?.data?.message || error.message)
      return false
    }
  }

  async runAllTests() {
    console.log("🚀 Starting API Tests...\n")

    const tests = [
      { name: "Health Check", fn: () => this.testHealthCheck() },
      { name: "Login", fn: () => this.testLogin() },
      { name: "Token Verification", fn: () => this.testTokenVerification() },
      { name: "Create Doctor", fn: () => this.testCreateDoctor() },
      { name: "Create Patient", fn: () => this.testCreatePatient() },
    ]

    let passed = 0
    let failed = 0

    for (const test of tests) {
      const result = await test.fn()
      if (result) {
        passed++
      } else {
        failed++
      }
      console.log("")
    }

    console.log("📊 Test Results:")
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`)

    if (failed === 0) {
      console.log("\n🎉 All tests passed! Your API is working correctly.")
    } else {
      console.log("\n⚠️  Some tests failed. Please check the error messages above.")
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new APITester()
  tester.runAllTests().catch(console.error)
}

export default APITester
