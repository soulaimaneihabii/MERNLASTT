import axios from "axios"
import { notification } from "antd"

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3001/api",
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log("🌐 API Request:", config.method?.toUpperCase(), config.url, config.data || "")
    return config
  },
  (error) => {
    console.error("🚫 Request interceptor error:", error)
    return Promise.reject(error)
  },
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", response.status, response.config.url, response.data)
    return response
  },
  (error) => {
    console.error(
      "❌ API Error:",
      error.response?.status,
      error.response?.data,
      error.config?.url,
      error.config?.data || "",
    )

    // Extract the error message for better display
    const errorMessage = error.response?.data?.message || error.message || "An unknown error occurred"

    if (error.response?.status === 401) {
      console.log("🔒 Unauthorized - clearing token and redirecting to login")
      localStorage.removeItem("token")
      if (window.location.pathname !== "/login") {
        window.location.href = "/login"
      }
    }

    if (error.response?.status >= 500) {
      notification.error({
        message: "Server Error",
        description: errorMessage,
      })
    }

    // Enhance the error object with a better message
    error.displayMessage = errorMessage
    return Promise.reject(error)
  },
)

// Auth API - try multiple endpoint patterns to match your backend
export const authAPI = {
  login: async (credentials) => {
    console.log("🔐 Calling login API with:", { email: credentials.email, password: "***" });

    try {
      const response = await api.post("/auth/login", credentials);
      console.log("✅ Login success:", response);
      return response;
    } catch (error) {
      console.log("❌ Login failed:", error.response?.status, error.displayMessage);
      throw error;
    }
  },

  verifyToken: async () => {
    console.log("🔍 Calling verify token API");

    try {
      const response = await api.get("/auth/verify");
      console.log("✅ Verify success:", response);
      return response;
    } catch (error) {
      console.log("❌ Verify failed:", error.response?.status, error.displayMessage);
      throw error;
    }
  },

  logout: () => api.post("/auth/logout"),
};


// Users API
export const usersAPI = {
  getUsers: (params) => api.get("/users", { params }),
  createUser: (userData) => api.post("/users", userData),
  createPatientUser: (userData) => api.post("/users/create-patient-user", userData), // 🚀 ajouté ici
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserById: (id) => api.get(`/users/${id}`),
}

export const patientsAPI = {
  // GET /patients — supports: doctorId, userId (optional)
  getPatients: (params = {}) => api.get("/patients", { params }),

  // POST /patients — create new patient
  createPatient: (patientData) => api.post("/patients", patientData),

  // PUT /patients/:id — update patient
  updatePatient: (id, patientData) => api.put(`/patients/${id}`, patientData),

  // DELETE /patients/:id — delete patient
  deletePatient: (id) => api.delete(`/patients/${id}`),

  // GET /patients/:id — get patient by ID
  getPatientById: (id) => api.get(`/patients/${id}`),

  // GET /patients/:id/export — export patient data
  exportPatientData: (id) => api.get(`/patients/${id}/export`, { responseType: "blob" }),

  // GET /patients?userId= — for fetchCurrentPatient
  getPatientByUserId: (userId) => api.get("/patients", { params: { userId } }),

  // GET /patients/me — for patient role
  getCurrentPatient: () => api.get("/patients/me"),
};

// Patients API
// export const patientsAPI = {
//   getPatients: (params) => api.get("/patients", { params }),
//   createPatient: (patientData) => api.post("/patients", patientData),
//   updatePatient: (id, patientData) => api.put(`/patients/${id}`, patientData),
//   deletePatient: (id) => api.delete(`/patients/${id}`),
//   getPatientById: (id) => api.get(`/patients/${id}`),
//   exportPatientData: (id) => api.get(`/patients/${id}/export`, { responseType: "blob" }),
//   getPatientByUserId: (userId) => api.get("/patients", { params: { userId } }),
//   getCurrentPatient: () => api.get("/patients/me"),
  

// }

// Predictions API
export const predictionsAPI = {
  createPrediction: (predictionData) => api.post("/predictions", predictionData),
  getPredictions: (params) => api.get("/predictions", { params }),
  getPredictionHistory: (patientId) => api.get(`/predictions/patient/${patientId}`),
  getPredictionById: (id) => api.get(`/predictions/${id}`),
}

// Appointments API
export const appointmentsAPI = {
  getAppointments: (params) => api.get("/appointments", { params }),
  createAppointment: (appointmentData) => api.post("/appointments", appointmentData),
  updateAppointment: (id, appointmentData) => api.put(`/appointments/${id}`, appointmentData),
  deleteAppointment: (id) => api.delete(`/appointments/${id}`),
  getAppointmentById: (id) => api.get(`/appointments/${id}`),
}
export const analyticsAPI = {
  getDashboardStats: () => api.get("/analytics/dashboard"),
  getPredictionAnalytics: (period = "30d") => api.get(`/analytics/predictions?period=${period}`),
  getPatientAnalytics: () => api.get("/analytics/patients"),
  getUserAnalytics: () => api.get("/analytics/users"),
  getSystemHealth: () => api.get("/analytics/system-health"),
  getPatientsPerDoctor: () => api.get("/analytics/patients-per-doctor"),
  
  getDoctorDashboardStats: async () => axios.get("/api/analytics/dashboard"),

}

export default api