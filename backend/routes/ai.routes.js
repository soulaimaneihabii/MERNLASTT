import { suggest } from "../controllers/ai.controller.js";
import express from "express"

import path from "path"

const router = express.Router()


import { protect, authorize } from "../middleware/auth.middleware.js"


router.post("/suggest",protect,authorize("doctor"),suggest)

export default router