import asyncHandler from "express-async-handler"
import crypto from "crypto"
import User from "../models/User.model.js"
// import notificationService from "../services/notification.service.js"

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, specialization, licenseNumber, phone, department } = req.body

  // Check if user exists
  const userExists = await User.findOne({ email })

  if (userExists) {
    res.status(400)
    throw new Error("User already exists")
  }

  // Validate required fields for doctors
  if (role === "doctor") {
    if (!specialization || !licenseNumber) {
      res.status(400)
      throw new Error("Specialization and license number are required for doctors")
    }

    // Check if license number already exists
    const licenseExists = await User.findOne({ licenseNumber })
    if (licenseExists) {
      res.status(400)
      throw new Error("License number already exists")
    }
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
    specialization,
    licenseNumber,
    phone,
    department,
  })

  // Generate email verification token
  const verificationToken = crypto.randomBytes(20).toString("hex")
  user.emailVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex")

  await user.save({ validateBeforeSave: false })

  // Send verification email
  try {
    await notificationService.sendEmailVerification(user, verificationToken)
  } catch (error) {
    console.error("Error sending verification email:", error)
    // Don't fail registration if email fails
  }

  sendTokenResponse(user, 201, res, "User registered successfully. Please check your email for verification.")
})

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Validate email & password
  if (!email || !password) {
    res.status(400)
    throw new Error("Please provide an email and password")
  }

  // Check for user
  const user = await User.findOne({ email }).select("+password")

  if (!user) {
    res.status(401)
    throw new Error("Invalid credentials")
  }

  // Check if account is locked
  if (user.isLocked) {
    res.status(423)
    throw new Error("Account temporarily locked due to too many failed login attempts")
  }

  // Check if user is active
  if (!user.isActive) {
    res.status(401)
    throw new Error("Account is deactivated. Please contact administrator.")
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password)

  if (!isMatch) {
    // Increment login attempts
    await user.incLoginAttempts()
    res.status(401)
    throw new Error("Invalid credentials")
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts()
  }

  // Update last login
  user.lastLogin = new Date()
  await user.save({ validateBeforeSave: false })

  sendTokenResponse(user, 200, res, "Login successful")
})

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  })
})

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc    Verify token
// @route   GET /api/auth/verify
// @access  Private
export const verifyToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)

  res.status(200).json({
    success: true,
    valid: true,
    data: user,
    message: "Token is valid",
  })
})

// @desc    Validate token (alias for verify)
// @route   GET /api/auth/validate-token
// @access  Private
export const validateToken = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)

  res.status(200).json({
    success: true,
    valid: true,
    data: user,
    message: "Token is valid",
  })
})

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
export const updateDetails = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    department: req.body.department,
  }

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach((key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key])

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: user,
    message: "Details updated successfully",
  })
})

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("+password")

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    res.status(401)
    throw new Error("Password is incorrect")
  }

  user.password = req.body.newPassword
  await user.save()

  sendTokenResponse(user, 200, res, "Password updated successfully")
})

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    res.status(404)
    throw new Error("There is no user with that email")
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString("hex")

  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")

  // Set expire (10 minutes)
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000

  await user.save({ validateBeforeSave: false })

  try {
    await notificationService.sendPasswordReset(user, resetToken)

    res.status(200).json({
      success: true,
      message: "Password reset email sent",
    })
  } catch (error) {
    console.error("Error sending password reset email:", error)
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save({ validateBeforeSave: false })

    res.status(500)
    throw new Error("Email could not be sent")
  }
})

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  // Get hashed token
  const resetPasswordToken = crypto.createHash("sha256").update(req.params.resettoken).digest("hex")

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  })

  if (!user) {
    res.status(400)
    throw new Error("Invalid or expired token")
  }

  // Set new password
  user.password = req.body.password
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined

  await user.save()

  sendTokenResponse(user, 200, res, "Password reset successful")
})

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req, res) => {
  // Get hashed token
  const emailVerificationToken = crypto.createHash("sha256").update(req.params.token).digest("hex")

  const user = await User.findOne({
    emailVerificationToken,
  })

  if (!user) {
    res.status(400)
    throw new Error("Invalid verification token")
  }

  // Verify email
  user.isEmailVerified = true
  user.emailVerificationToken = undefined

  await user.save({ validateBeforeSave: false })

  res.status(200).json({
    success: true,
    message: "Email verified successfully",
  })
})

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Private
export const resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)

  if (user.isEmailVerified) {
    res.status(400)
    throw new Error("Email is already verified")
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(20).toString("hex")
  user.emailVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex")

  await user.save({ validateBeforeSave: false })

  try {
    await notificationService.sendEmailVerification(user, verificationToken)

    res.status(200).json({
      success: true,
      message: "Verification email sent",
    })
  } catch (error) {
    console.error("Error sending verification email:", error)
    res.status(500)
    throw new Error("Email could not be sent")
  }
})

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res, message) => {
  // Create token
  const token = user.getSignedJwtToken()

  // Remove password from output
  user.password = undefined

  res.status(statusCode).json({
    success: true,
    token,
    data: user,
    message,
  })
}
