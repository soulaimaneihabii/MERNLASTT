// routes/documentRoutes.js
import express from "express"
import { extractAndStoreScannedData,getScannedDocsByPatient } from "../controllers/document.controller.js"
import { protect, authorize } from "../middleware/auth.middleware.js"
const router = express.Router()

router.post("/extract-fields", extractAndStoreScannedData)       //  ,authorize("doctor", "patient")
 router.get("/by-patient/:patientId", getScannedDocsByPatient); // ,authorize("doctor", "patient")
 export default router
