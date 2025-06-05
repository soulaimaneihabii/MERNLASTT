import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import rateLimit from "express-rate-limit"
import mongoSanitize from "express-mongo-sanitize"
import xss from "xss-clean"
import hpp from "hpp"
import swaggerJSDoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"
import { createServer } from "http"
import { Server } from "socket.io"

// Load env vars
dotenv.config()

// Import database connection
import connectDB from "./config/database.js"

// Import middleware
import {errorHandler}from "./middleware/error.middleware.js"

// Import routes
import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/user.routes.js"
import patientRoutes from "./routes/patient.routes.js"
import predictionRoutes from "./routes/prediction.routes.js"
import analyticsRoutes from "./routes/analytics.routes.js"
// import reportsRoutes from "./routes/reports.routes.js"
// import appointmentsRoutes from "./routes/appointments.routes.js"
// import debugRoutes from "./routes/debug.routes.js"

// Connect to database
connectDB()

const app = express()

// Create HTTP server
const server = createServer(app)

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Make io accessible to routes
app.set("io", io)

// Body parser middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Security middleware
app.use(helmet())
app.use(mongoSanitize())
app.use(xss())
app.use(hpp())

// CORS
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
})
app.use(limiter)

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"))
}

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Medical Application API",
      version: "1.0.0",
      description: "A comprehensive medical application API with AI predictions",
      contact: {
        name: "API Support",
        email: "support@medical-app.com",
      },
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:3001/api",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js", "./controllers/*.js"],
}

const swaggerSpec = swaggerJSDoc(swaggerOptions)

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Add debug routes before other routes
// app.use("/api/debug", debugRoutes)

// API routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/patients", patientRoutes)
app.use("/api/predictions", predictionRoutes)
app.use("/api/analytics", analyticsRoutes)
// app.use("/api/reports", reportsRoutes)
// app.use("/api/appointments", appointmentsRoutes)

// Alternative login endpoint (for frontend compatibility)
app.use("/api/login", authRoutes)

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Medical Application API",
    version: "1.0.0",
    documentation: "/api-docs",
    health: "/health",
  })
})

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.on("join-room", (userId) => {
    socket.join(`user-${userId}`)
    console.log(`User ${userId} joined room`)
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

// Error handler middleware (must be last)
app.use(errorHandler)

// Handle unhandled routes
app.all("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  })
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`)
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`)
  // Close server & exit process
  server.close(() => {
    process.exit(1)
  })
})
