import asyncHandler from "../middleware/asyncHandler.js";
import User from "../models/User.model.js";
import Patient from "../models/Patient.model.js";
import Prediction from "../models/Prediction.model.js";
// import notificationService from "../services/notification.service.js";

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
  const page = Number.parseInt(req.query.page, 10) || 1;
  const limit = Number.parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const filter = {};

  // 🚀 Add this condition:
  if (req.query.role === 'admin_or_doctor') {
    filter.role = { $in: ['admin', 'doctor'] };
  } else if (req.query.role) {
    filter.role = req.query.role;
  }

  if (req.query.department) {
    filter.department = new RegExp(req.query.department, "i");
  }

  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === "true";
  }

  const total = await User.countDocuments(filter);

  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  const pagination = {};
  if (startIndex + limit < total) pagination.next = { page: page + 1, limit };
  if (startIndex > 0) pagination.prev = { page: page - 1, limit };

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    pagination,
    data: users,
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, specialization, licenseNumber, phone, department, status } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Validate doctor
  if (role === "doctor") {
    if (!specialization || !licenseNumber) {
      res.status(400);
      throw new Error("Specialization and license number are required for doctors");
    }
    const licenseExists = await User.findOne({ licenseNumber });
    if (licenseExists) {
      res.status(400);
      throw new Error("License number already exists");
    }
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    specialization: role === "doctor" ? specialization : undefined,
    licenseNumber: role === "doctor" ? licenseNumber : undefined,
    phone,
    department,
    status,
    isEmailVerified: true, // Pre-verified
  });

  // Optionally send welcome email
  // try {
  //   await notificationService.sendWelcomeEmail(user);
  // } catch (error) {
  //   console.error("Error sending welcome email:", error);
  // }

  res.status(201).json({
    success: true,
    data: user,
    message: "User created successfully",
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (req.body.password) delete req.body.password;

  if (req.body.role === "doctor") {
    if (!req.body.specialization && !user.specialization) {
      res.status(400);
      throw new Error("Specialization is required for doctors");
    }
    if (!req.body.licenseNumber && !user.licenseNumber) {
      res.status(400);
      throw new Error("License number is required for doctors");
    }
    if (req.body.licenseNumber && req.body.licenseNumber !== user.licenseNumber) {
      const licenseExists = await User.findOne({
        licenseNumber: req.body.licenseNumber,
        _id: { $ne: user._id },
      });
      if (licenseExists) {
        res.status(400);
        throw new Error("License number already exists");
      }
    }
  }

  user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).select("-password");

  res.status(200).json({
    success: true,
    data: user,
    message: "User updated successfully",
  });
});

// @desc    Update user status
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user._id.toString() === req.user.id && req.body.isActive === false) {
    res.status(400);
    throw new Error("You cannot deactivate your own account");
  }

  user.isActive = req.body.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    data: user,
    message: `User ${req.body.isActive ? "activated" : "deactivated"} successfully`,
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
// DELETE /api/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.role === "doctor") {
    const patients = await Patient.find({ doctor: user._id });

    for (const patient of patients) {
      await Prediction.deleteMany({ patient: patient._id });
      await patient.deleteOne();
    }

    // 🆕 Delete predictions directly linked to the doctor
    await Prediction.deleteMany({ doctor: user._id });

    console.log(`Deleted ${patients.length} patients and their predictions`);
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User deleted successfully, along with related patients/predictions",
  });
});


// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private/Admin
export const getUserStats = asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } },
        inactiveUsers: { $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] } },
        verifiedUsers: { $sum: { $cond: [{ $eq: ["$isEmailVerified", true] }, 1, 0] } },
        unverifiedUsers: { $sum: { $cond: [{ $eq: ["$isEmailVerified", false] }, 1, 0] } },
      },
    },
  ]);

  const roleStats = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  const departmentStats = await User.aggregate([
    { $match: { department: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: "$department",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const recentUsers = await User.find()
    .select("name email role createdAt isActive")
    .sort({ createdAt: -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    data: {
      overview: stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        verifiedUsers: 0,
        unverifiedUsers: 0,
      },
      roleDistribution: roleStats,
      departmentDistribution: departmentStats,
      recentUsers,
    },
  });
});
