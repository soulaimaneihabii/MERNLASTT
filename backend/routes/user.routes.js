import express from "express";
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  updateUserStatus,
} from "../controllers/user.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get("/", protect, authorize("admin"), getUsers);

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private/Admin
router.get("/stats", protect, authorize("admin"), getUserStats);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private/Admin
router.get("/:id", protect, authorize("admin"), getUser);

// @route   POST /api/users
// @desc    Create new user (Admin creates Doctor or Admin)
// @access  Private/Admin
router.post("/", protect, authorize("admin"), createUser);

// @route   POST /api/users/create-patient-user
// @desc    Doctor creates patient user (linked to Patient)
// @access  Private/Doctor
router.post("/create-patient-user", protect, authorize("doctor"), createUser);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private/Admin
router.put("/:id", protect, authorize("admin"), updateUser);

// @route   PATCH /api/users/:id/status
// @desc    Update user status (activate/deactivate)
// @access  Private/Admin
router.patch("/:id/status", protect, authorize("admin"), updateUserStatus);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete("/:id", protect, authorize("admin"), deleteUser);

export default router;
