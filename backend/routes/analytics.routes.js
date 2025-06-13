import express from "express"
import {
  getDashboardStats,
  getPredictionAnalytics,
  getPatientAnalytics,
  getUserAnalytics,
  getSystemHealth,
  getPatientsPerDoctor, fetchDoctorDashboardStatse, // 🚀 Add this!
} from "../controllers/analytics.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js"

const router = express.Router()

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *       401:
 *         description: Not authorized
 */
router.get("/dashboard", protect, authorize("admin", "doctor"), getDashboardStats)
router.get("/patients-per-doctor", protect, authorize("admin"), getPatientsPerDoctor);
router.get("/dashboard",protect, authorize("doctor"), fetchDoctorDashboardStatse);

/**
 * @swagger
 * /api/analytics/predictions:
 *   get:
 *     summary: Get prediction analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Prediction analytics
 *       401:
 *         description: Not authorized
 */
router.get("/predictions", protect, authorize("admin", "doctor"), getPredictionAnalytics)

/**
 * @swagger
 * /api/analytics/patients:
 *   get:
 *     summary: Get patient analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient analytics
 *       401:
 *         description: Not authorized
 */
router.get("/patients", protect, authorize("admin", "doctor"), getPatientAnalytics)

/**
 * @swagger
 * /api/analytics/users:
 *   get:
 *     summary: Get user analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User analytics
 *       401:
 *         description: Not authorized
 */
router.get("/users", protect, authorize("admin"), getUserAnalytics)

/**
 * @swagger
 * /api/analytics/system-health:
 *   get:
 *     summary: Get system health metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health metrics
 *       401:
 *         description: Not authorized
 */
router.get("/system-health", protect, authorize("admin"), getSystemHealth)

export default router
