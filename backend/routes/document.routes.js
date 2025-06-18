// routes/documentRoutes.js
import express from "express"
import { extractAndStoreScannedData } from "../controllers/document.controller.js"

const router = express.Router()

router.post("/extract-fields", extractAndStoreScannedData)

export default router
