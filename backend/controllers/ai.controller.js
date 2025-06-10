// controllers/ai.controller.js
import axios from "axios";
import Patient from "../models/Patient.model.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const suggest = asyncHandler(async (req, res) => {
  const { patientId } = req.body;

  try {
    // Forward to Flask AI server
    const response = await axios.post("http://localhost:5001/ai/assist", {
      patient_id: patientId,
    });

    const aiData = response.data?.data?.suggestedFields;

    res.json({
      suggestedFields: aiData,
    });
  } catch (error) {
    console.error("AI backend error:", error.message);
    res.status(500).json({ message: "Failed to get AI suggestions" });
  }
});
