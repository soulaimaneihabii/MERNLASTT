import jwt from "jsonwebtoken"
import asyncHandler from "express-async-handler"
import User from "../models/User.model.js"

// Protect routes
const protect = asyncHandler(async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1]

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Get user from the token
      req.user = await User.findById(decoded.id).select("-password")

      if (!req.user) {
        res.status(401)
        throw new Error("Not authorized, user not found")
      }

      // Check if user is active
      if (!req.user.isActive) {
        res.status(401)
        throw new Error("Account is deactivated")
      }

      next()
    } catch (error) {
      console.error("Token verification failed:", error.message)

      if (error.name === "JsonWebTokenError") {
        res.status(401).json({
          success: false,
          message: "Token invalid",
        })
      } else if (error.name === "TokenExpiredError") {
        res.status(401).json({
          success: false,
          message: "Token expired",
        })
      } else {
        res.status(401).json({
          success: false,
          message: "Not authorized, token failed",
        })
      }
      return
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Not authorized, no token",
    })
    return
  }
})

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401)
      throw new Error("Not authorized")
    }

    if (!roles.includes(req.user.role)) {
      res.status(403)
      throw new Error(`User role ${req.user.role} is not authorized to access this route`)
    }

    next()
  }
}

// Optional authentication (for public routes that can benefit from user context)
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = await User.findById(decoded.id).select("-password")
    } catch (error) {
      // Token is invalid, but we don't throw an error for optional auth
      req.user = null
    }
  }

  next()
})

export { protect, authorize, optionalAuth }
