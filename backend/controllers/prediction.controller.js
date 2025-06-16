import asyncHandler from "../middleware/asyncHandler.js"
import Patient from "../models/Patient.model.js"
import Prediction from "../models/Prediction.model.js"
import aiService from "../services/ai.service.js"
import mongoose from "mongoose";

// import notificationService from "../services/notification.service.js"

// @desc    Get all predictions
// @route   GET /api/predictions
// @access  Private/Doctor or Admin
export const getPredictions = asyncHandler(async (req, res) => {
  const page = Number.parseInt(req.query.page, 10) || 1
  const limit = Number.parseInt(req.query.limit, 10) || 10
  const startIndex = (page - 1) * limit

  // Build filter based on user role
  const filter = {}
  if (req.user.role === "doctor") {
    filter.doctor = req.user.id
  }

  // Get total count for pagination
  const total = await Prediction.countDocuments(filter)

  // Get predictions with pagination
  const predictions = await Prediction.find(filter)
    .populate("patient", "firstName lastName age email")
    .populate("doctor", "name email")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(startIndex)

  // Pagination result
  const pagination = {}

  if (startIndex + limit < total) {
    pagination.next = {
      page: page + 1,
      limit,
    }
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    }
  }

  res.status(200).json({
    success: true,
    count: predictions.length,
    total,
    pagination,
    data: predictions,
  })
})

// @desc    Get single prediction
// @route   GET /api/predictions/:id
// @access  Private/Doctor or Admin
export const getSinglePrediction = asyncHandler(async (req, res) => {
  const prediction = await Prediction.findById(req.params.id)
    .populate("patient", "firstName lastName age email")
    .populate("doctor", "name email")

  if (!prediction) {
    res.status(404)
    throw new Error("Prediction not found")
  }

  // Check if user has access to this prediction
  if (req.user.role === "doctor" && prediction.doctor._id.toString() !== req.user.id) {
    res.status(403)
    throw new Error("Not authorized to access this prediction")
  }

  res.status(200).json({
    success: true,
    data: prediction,
  })
})

// @desc    Create new prediction
// @route   POST /api/predictions
// @access  Private/Doctor
// @desc    Create new prediction
// @route   POST /api/predictions
// @access  Private/Doctor
export const createPrediction = asyncHandler(async (req, res) => {
  const { patientId, medicalData, notes } = req.body;

  const patient = await Patient.findById(patientId);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  if (req.user.role === "doctor" && patient.doctor.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to create prediction for this patient");
  }

  console.log("🚀 Sending to Flask:", medicalData);

  try {
    const aiPrediction = await aiService.getPredictionFromFlask(medicalData);

    console.log("✅ AI Prediction:", aiPrediction);

    // ✅ Normalize the risk level for database consistency
  const predictionResult = aiPrediction.risk_level || "Unknown"; // ✅ Trust the AI's label
const resultRisk = aiPrediction.result_risk || "unknown";      // ✅ for internal use


    const prediction = await Prediction.create({
      patient: patientId,
      doctor: req.user.id,
      result: {
        risk: aiPrediction.result_risk || "unknown",
        score: aiPrediction.confidence || 0.8,
      },
      predictionResult, // ✅ Use normalized risk level here
      confidence: aiPrediction.confidence,
      diseaseTypes: aiPrediction.chronic_disease_types || [],
      recommendations: aiPrediction.recommendations || [],
      notes: notes || "",
      status: "pending",
      metadata: {
        aiServiceVersion: "1.0.0",
        modelVersion: "1.0.0",
        processingTime: 0,
        inputDataHash: "",
      },
    });

    await prediction.populate("patient", "firstName lastName age email");
    await prediction.populate("doctor", "name email");

    res.status(201).json({
      success: true,
      data: prediction,
      message: "Prediction created successfully",
    });
  } catch (error) {
    console.error("Error creating prediction:", error);
    res.status(500);
    throw new Error(`Failed to create prediction: ${error.message}`);
  }
});


// @desc    Get prediction history for a patient
// @route   GET /api/predictions/patient/:patientId
// @access  Private/Doctor or Admin
// @desc    Get prediction history for a patient
// @route   GET /api/predictions/patient/:patientId
// @access  Private/Doctor, Admin, Patient
export const getPredictionHistory = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  // Find the patient
  const patient = await Patient.findById(patientId);

  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  // Check if doctor has access to this patient
  if (req.user.role === "doctor" && patient.doctor.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to access this patient's predictions");
  }

  // Check if patient is trying to access their own predictions
  if (req.user.role === "patient") {
    if (!patient.user) {
      res.status(403);
      throw new Error("Patient record is not linked to your account.");
    }
    if (patient.user.toString() !== req.user.id) {
      res.status(403);
      throw new Error("You can only access your own predictions.");
    }
  }

  // Get predictions
  const predictions = await Prediction.find({ patient: patientId })
    .populate("doctor", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: predictions.length,
    data: predictions,
  });
});

// @desc    Update prediction
// @route   PUT /api/predictions/:id
// @access  Private/Doctor
export const updatePrediction = asyncHandler(async (req, res) => {
  const prediction = await Prediction.findById(req.params.id)

  if (!prediction) {
    res.status(404)
    throw new Error("Prediction not found")
  }

  // Check if user has access to this prediction
  if (req.user.role === "doctor" && prediction.doctor.toString() !== req.user.id) {
    res.status(403)
    throw new Error("Not authorized to update this prediction")
  }

  // Update allowed fields
  const allowedFields = ["status", "notes"]
  const updateData = {}

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field]
    }
  })

  const updatedPrediction = await Prediction.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("patient", "firstName lastName age email")
    .populate("doctor", "name email")

  res.status(200).json({
    success: true,
    data: updatedPrediction,
    message: "Prediction updated successfully",
  })
})

// @desc    Delete prediction
// @route   DELETE /api/predictions/:id
// @access  Private/Admin
export const deletePrediction = asyncHandler(async (req, res) => {
  const prediction = await Prediction.findById(req.params.id)

  if (!prediction) {
    res.status(404)
    throw new Error("Prediction not found")
  }

  await prediction.deleteOne()

  res.status(200).json({
    success: true,
    data: {},
    message: "Prediction deleted successfully",
  })
})

// @desc    Get prediction statistics
// @route   GET /api/predictions/stats
// @access  Private/Doctor or Admin
// @desc    Get prediction statistics (ALL predictions by risk type)
export const getPredictionStats = asyncHandler(async (req, res) => {
  const isDoctor = req.user.role === "doctor";
  const matchCondition = isDoctor ? { doctor: new mongoose.Types.ObjectId(req.user.id) } : {};

  console.log("📊 Match condition for stats:", matchCondition);

  const raw = await Prediction.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: { $toLower: "$result.risk" },
        count: { $sum: 1 }
      }
    }
  ]);

  console.log("🛠 Raw aggregation result:", raw);

  const normalized = { high: 0, medium: 0, low: 0 };
  const map = {
    high: "high",
    "high risk": "high",
    critical: "high",
    moderate: "medium",
    medium: "medium",
    low: "low",
    "low risk": "low",
  };

  raw.forEach((item) => {
    const key = map[item._id] || null;
    if (key && normalized[key] !== undefined) {
      normalized[key] += item.count;
    }
  });

  const riskDistribution = [
    { _id: "high", count: normalized.high },
    { _id: "medium", count: normalized.medium },
    { _id: "low", count: normalized.low },
  ];

  console.log("✅ Final risk distribution:", riskDistribution);

  res.status(200).json({
    success: true,
    data: {
      riskDistribution,
      totalPredictions: normalized.high + normalized.medium + normalized.low,
    },
  });
});
