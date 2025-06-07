"use client"

import { useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { ConfigProvider, App as AntApp } from "antd"
import { checkAuthStatus } from "./store/slices/authSlice"
import Layout from "./components/Layout/Layout"
import Login from "./pages/Auth/Login"
import AdminDashboard from "./pages/Admin/AdminDashboard"
import DoctorDashboard from "./pages/Doctor/DoctorDashboard"
import MedicalInformation from "./pages/Doctor/MedicalInformation"
import Predictions from "./pages/Doctor/Predictions"
import PatientDashboard from "./pages/Patient/PatientDashboard"
import PatientForm from "./pages/Patient/PatientForm"
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute"
import "./App.css"
import EnhancedMedicalInformation from "./pages/Doctor/MedicalInformation"
import PatientAccountCreation from "./pages/Doctor/PatientAccountCreation"
import PatientMedicalInfo from "./pages/Doctor/PatientMedicalInfo"
import PatientDetailsPage from "../src/pages/Doctor/PatientDetailsPage"
import MyPatients from "./pages/Doctor/MyPatients"




const App = () => {
  const dispatch = useDispatch()
  const { isAuthenticated, loading } = useSelector((state) => state.auth)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      dispatch(checkAuthStatus())
    }
  }, [dispatch])

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "16px",
        }}
      >
        Loading...
      </div>
    )
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1890ff",
          borderRadius: 6,
        },
      }}
    >
      <AntApp>
        <Router>
          <Routes>
            <Route path="/login" element={isAuthenticated ? <DashboardRouter /> : <Login />} />

            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />

              <Route
                path="dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardRouter />
                  </ProtectedRoute>
                }
              />

              <Route
                path="admin/*"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="doctor/*"
  element={
    <ProtectedRoute allowedRoles={["doctor", "admin"]}>
      <Routes>
        <Route index element={<DoctorDashboard />} />
        <Route path="patients" element={<MyPatients />} />
        <Route path="patients/new" element={<PatientAccountCreation />} />
        <Route path="patients/:id" element={<PatientDetailsPage />} />
        <Route path="patients/:id/medical-info" element={<PatientMedicalInfo />} />
        <Route path="medical-info" element={<MedicalInformation />} />
        <Route path="predictions" element={<Predictions />} />
      </Routes>
    </ProtectedRoute>
  }
/>

              <Route
                path="patient/*"
                element={
                  <ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}>
                    <Routes>
                      <Route index element={<PatientDashboard />} />
                      <Route path="form" element={<PatientForm />} />
                    </Routes>
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AntApp>
    </ConfigProvider>
  )
}

const DashboardRouter = () => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth)

  console.log("DashboardRouter state:", { isAuthenticated, user, loading })

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Loading authentication...
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login")
    return <Navigate to="/login" replace />
  }

  if (!user) {
    console.log("No user data available")
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>Loading user data...</div>
        <div style={{ fontSize: "12px", marginTop: "10px", color: "#666" }}>
          If this persists, please refresh the page
        </div>
      </div>
    )
  }

  console.log("Redirecting user with role:", user.role)

  // Direct redirection based on user role
  switch (user.role) {
    case "admin":
      return <Navigate to="/admin" replace />
    case "doctor":
      return <Navigate to="/doctor" replace />
    case "patient":
      return <Navigate to="/patient" replace />
    default:
      console.log("Unknown role:", user.role)
      return <Navigate to="/login" replace />
  }
}

export default App
