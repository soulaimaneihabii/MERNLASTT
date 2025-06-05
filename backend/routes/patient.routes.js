import express from "express"
import multer from "multer"
import path from "path"
import { v4 as uuidv4 } from "uuid"
const router = express.Router()
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  validatePredictionData,
  exportPatientData,
  uploadMedicalFile,getCurrentPatient,
} from "../controllers/patient.controller.js"
import { protect, authorize } from "../middleware/auth.middleware.js"
import predictionRoutes from "./prediction.routes.js"

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/medical-files/")
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueFilename)
  },
})

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images, PDFs, and common document formats
  const allowedFileTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedFileTypes.test(file.mimetype)

  if (extname && mimetype) {
    return cb(null, true)
  } else {
    cb(new Error("Only images, PDFs, and common document formats are allowed!"), false)
  }
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter,
})

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
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *         description: Filter patients by doctor ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive, Discharged]
 *         description: Filter patients by status
 *     responses:
 *       200:
 *         description: List of patients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.get("/", protect, authorize("doctor", "admin"), getPatients)

/**
 * @swagger
 * /api/patients/doctor/{doctorId}:
 *   get:
 *     summary: Get patients by doctor ID
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: doctorId
 *         schema:
 *           type: string
 *         required: true
 *         description: Doctor ID
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
 *     responses:
 *       200:
 *         description: List of patients for the specified doctor
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Doctor not found
 */
router.get("/doctor/:doctorId", protect, authorize("doctor", "admin"), async (req, res) => {
  // Set doctorId as query parameter and call getPatients
  req.query.doctorId = req.params.doctorId
  return getPatients(req, res)
})

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
router.get("/me", protect, authorize("doctor", "admin", "patient"), getCurrentPatient)
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

/**
 * @swagger
 * /api/patients/{id}/upload:
 *   post:
 *     summary: Upload medical file for patient
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Patient not found
 */


router.post("/:id/upload", protect, authorize("doctor", "admin"), upload.single("file"), uploadMedicalFile)

// Nested routes for predictions
router.use("/:patientId/predictions", predictionRoutes)

export default router
