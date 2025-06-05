// Test helper functions for development
export const createTestData = () => {
  return {
    // Test patient data for AI prediction
    testPatientData: {
      age: 45,
      gender: "male",
      race: "caucasian",
      time_in_hospital: 3,
      num_lab_procedures: 5,
      num_procedures: 2,
      num_medications: 8,
      number_outpatient: 1,
      number_emergency: 0,
      number_inpatient: 1,
      number_diagnoses: 3,
      diag_1: "diabetes_type2",
      diag_2: "hypertension",
      diag_3: "none",
      max_glu_serum: ">200",
      A1Cresult: ">7",
      insulin: "steady",
      metformin: "up",
      diabetesMed: "yes",
    },

    // Test users for different roles
    testUsers: [
      {
        email: "admin@demo.com",
        password: "password",
        role: "admin",
        name: "Admin User",
      },
      {
        email: "doctor@demo.com",
        password: "password",
        role: "doctor",
        name: "Dr. Smith",
      },
      {
        email: "patient@demo.com",
        password: "password",
        role: "patient",
        name: "John Doe",
      },
    ],
  }
}

// Function to validate API responses
export const validateApiResponse = (response, expectedFields) => {
  const missingFields = expectedFields.filter((field) => !(field in response))
  if (missingFields.length > 0) {
    console.warn(`Missing fields in API response: ${missingFields.join(", ")}`)
  }
  return missingFields.length === 0
}

// Function to test WebSocket connection
export const testWebSocketConnection = (wsUrl, token) => {
  return new Promise((resolve, reject) => {
    const testSocket = new WebSocket(`${wsUrl}/ws/notifications?token=${token}`)

    testSocket.onopen = () => {
      console.log("✅ WebSocket connection test successful")
      testSocket.close()
      resolve(true)
    }

    testSocket.onerror = (error) => {
      console.error("❌ WebSocket connection test failed:", error)
      reject(error)
    }

    // Timeout after 5 seconds
    setTimeout(() => {
      if (testSocket.readyState === WebSocket.CONNECTING) {
        testSocket.close()
        reject(new Error("WebSocket connection timeout"))
      }
    }, 5000)
  })
}
