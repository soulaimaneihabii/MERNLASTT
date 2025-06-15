import axios from "axios";
import asyncHandler from "../middleware/asyncHandler.js";
import Patient from "../models/Patient.model.js";

// @desc    Get AI suggestions for patient using Flask backend
// @route   POST /api/ai/suggest
// @access  Private (Doctor/Admin)
export const suggest = asyncHandler(async (req, res) => {
  const { patientId } = req.body;

  console.log("📥 [NodeJS] Incoming AI suggestion request with patientId:", patientId);

  if (!patientId) {
    console.error("❌ [NodeJS] Missing patientId in request body.");
    return res.status(400).json({ message: "Missing patientId" });
  }

  // 🔍 Fetch the patient document
  const patient = await Patient.findById(patientId);

  if (!patient) {
    console.error("❌ [NodeJS] Patient not found with ID:", patientId);
    return res.status(404).json({ message: "Patient not found" });
  }

  if (!patient.user) {
    console.error("❌ [NodeJS] Patient has no linked user object:", patient);
    return res.status(404).json({ message: "Patient has no linked user" });
  }

  const user_id = patient.user.toString(); // 🔑 Convert to string for Flask
  console.log("✅ [NodeJS] Found linked user ID:", user_id);

  try {
    console.log("🚀 [NodeJS] Sending POST to Flask at /api/ai/assist...");

    const response = await axios.post("http://localhost:5001/api/ai/assist", {
      user_id, // ✅ Correct field Flask expects
    });

    console.log("✅ [NodeJS] Received response from Flask:", response.data);

    const aiData = response.data?.data?.suggestedFields;

    return res.json({
      success: true,
      suggestedFields: aiData || {},
    });

  } catch (error) {
    console.error("🔥 [NodeJS] Error while calling Flask:", error.message);

    if (error.response) {
      console.error("📡 [NodeJS] Flask response status:", error.response.status);
      console.error("📡 [NodeJS] Flask response data:", error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: "Failed to get AI suggestions from Flask",
      error: error.message,
    });
  }
});
