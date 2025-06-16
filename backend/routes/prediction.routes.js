import express from "express";
import {
  getPredictions,
  getSinglePrediction,
  createPrediction,
  updatePrediction,
  deletePrediction,
  getPredictionStats,
  getPredictionHistory,
} from "../controllers/prediction.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Predictions
 *   description: API endpoints for managing AI predictions
 */

/**
 * @swagger
 * /api/predictions:
 *   get:
 *     summary: Get all predictions
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of predictions
 */
router.get("/", protect, authorize("doctor", "admin"), getPredictions);

/**
 * @swagger
 * /api/predictions:
 *   post:
 *     summary: Create a new prediction
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Prediction created
 */
router.post("/", protect, authorize("doctor"), createPrediction);

/**
 * @swagger
 * /api/predictions/{id}:
 *   get:
 *     summary: Get a single prediction
 *     tags: [Predictions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prediction data
 */

router.get("/stats", protect, authorize("doctor", "admin"), getPredictionStats);

router.get("/:id", protect, authorize("doctor", "admin"), getSinglePrediction);

/**
 * @swagger
 * /api/predictions/patient/{patientId}:
 *   get:
 *     summary: Get prediction history for a patient
 *     tags: [Predictions]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prediction history
 */
router.get("/patient/:patientId", protect, authorize("doctor", "admin", "patient"), getPredictionHistory);

/**
 * @swagger
 * /api/predictions/{id}:
 *   put:
 *     summary: Update a prediction
 *     tags: [Predictions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prediction updated
 */
router.put("/:id", protect, authorize("doctor"), updatePrediction);

/**
 * @swagger
 * /api/predictions/{id}:
 *   delete:
 *     summary: Delete a prediction
 *     tags: [Predictions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prediction deleted
 */
router.delete("/:id", protect, authorize("admin"), deletePrediction);

/**
 * @swagger
 * /api/predictions/stats:
 *   get:
 *     summary: Get prediction statistics
 *     tags: [Predictions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prediction statistics
 */
export default router;
