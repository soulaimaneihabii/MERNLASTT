import express from "express"
const router = express.Router()
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  validatePredictionData,
  exportPatientData,
} from "../controllers/patient.controller.js"
import { protect, authorize } from "../middleware/auth.middleware.js"
import predictionRoutes from "./prediction.routes.js"

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Get all patients
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of patients per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: List of patients
 *       401:
 *         description: Not authorized
 */
router.get("/", protect, authorize("doctor", "admin"), getPatients)

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient data
 *       404:
 *         description: Patient not found
 *       401:
 *         description: Not authorized
 */
router.get("/:id", protect, authorize("doctor", "admin"), getPatientById)

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: Create new patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - age
 *               - gender
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               age:
 *                 type: integer
 *               gender:
 *                 type: string
 *     responses:
 *       201:
 *         description: Patient created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Not authorized
 */
router.post("/", protect, authorize("doctor", "admin"), createPatient)

/**
 * @swagger
 * /api/patients/{id}:
 *   put:
 *     summary: Update patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *       404:
 *         description: Patient not found
 *       401:
 *         description: Not authorized
 */
router.put("/:id", protect, authorize("doctor", "admin"), updatePatient)

/**
 * @swagger
 * /api/patients/{id}:
 *   delete:
 *     summary: Delete patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient deleted successfully
 *       404:
 *         description: Patient not found
 *       401:
 *         description: Not authorized
 */
router.delete("/:id", protect, authorize("admin"), deletePatient)

/**
 * @swagger
 * /api/patients/{id}/export:
 *   get:
 *     summary: Export patient data
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient data exported
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Patient not found
 *       401:
 *         description: Not authorized
 */
router.get("/:id/export", protect, authorize("doctor", "admin"), exportPatientData)

/**
 * @swagger
 * /api/patients/{id}/validate-prediction-data:
 *   get:
 *     summary: Validate patient data for AI prediction
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Validation result
 *       404:
 *         description: Patient not found
 *       401:
 *         description: Not authorized
 */
router.get("/:id/validate-prediction-data", protect, authorize("doctor", "admin"), validatePredictionData)

// Nested routes for predictions
router.use("/:patientId/predictions", predictionRoutes)

export default router
