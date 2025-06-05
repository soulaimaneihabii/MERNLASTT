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

router.get("/", protect, authorize("doctor", "admin"), getPredictions);
router.post("/", protect, authorize("doctor"), createPrediction);
router.get("/:id", protect, authorize("doctor", "admin"), getSinglePrediction);

// 🚀 Ici : on autorise aussi "patient"
router.get("/patient/:patientId", protect, authorize("doctor", "admin", "patient"), getPredictionHistory);

router.put("/:id", protect, authorize("doctor"), updatePrediction);
router.delete("/:id", protect, authorize("admin"), deletePrediction);
router.get("/stats", protect, authorize("doctor", "admin"), getPredictionStats);

export default router;
