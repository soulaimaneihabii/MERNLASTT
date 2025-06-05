import asyncHandler from "../middleware/asyncHandler.js"
import Patient from "../models/Patient.model.js"
import Prediction from "../models/Prediction.model.js"
import aiService from "../services/ai.service.js"
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

  // Find the patient
  const patient = await Patient.findById(patientId);

  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  // Check if doctor has access to this patient
  if (req.user.role === "doctor" && patient.doctor.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to create prediction for this patient");
  }

  try {
    // ✅ Send to Flask AI service!
    const aiPrediction = await aiService.getPredictionFromFlask(medicalData);

    // Create prediction record
    const prediction = await Prediction.create({
      patient: patientId,
      doctor: req.user.id,
      predictionResult: aiPrediction.prediction,
      riskLevel: aiPrediction.risk_level,
      diseaseTypes: aiPrediction.chronic_disease_types,
      confidence: aiPrediction.confidence,
      recommendations: aiPrediction.recommendations,
      probabilityScores: aiPrediction.probability_scores,
      notes: notes || "",
      status: "pending",
    });

    // Populate the prediction
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

  // 🚀 Check if patient is trying to access their own predictions
  // Assumes Patient model has `userId` field linked to User._id
  if (req.user.role === "patient" && patient.userId.toString() !== req.user.id) {
    res.status(403);
    throw new Error("You can only access your own predictions");
  }

  // Get all predictions for this patient
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
export const getPredictionStats = asyncHandler(async (req, res) => {
  const isDoctor = req.user.role === "doctor"
  const matchCondition = isDoctor ? { doctor: req.user.id } : {}

  // Get basic stats
  const totalPredictions = await Prediction.countDocuments(matchCondition)
  const pendingPredictions = await Prediction.countDocuments({ ...matchCondition, status: "pending" })
  const confirmedPredictions = await Prediction.countDocuments({ ...matchCondition, status: "confirmed" })
  const highRiskPredictions = await Prediction.countDocuments({
    ...matchCondition,
    predictionResult: { $in: ["High Risk", "Critical Risk"] },
  })

  // Get accuracy rate
  const accuracyRate = totalPredictions > 0 ? (confirmedPredictions / totalPredictions) * 100 : 0

  // Get risk distribution
  const riskDistribution = await Prediction.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: "$predictionResult",
        count: { $sum: 1 },
      },
    },
  ])

  // Get recent predictions
  const recentPredictions = await Prediction.find(matchCondition)
    .populate("patient", "firstName lastName")
    .sort({ createdAt: -1 })
    .limit(5)
    .select("predictionResult confidence status createdAt")

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalPredictions,
        pendingPredictions,
        confirmedPredictions,
        highRiskPredictions,
        accuracyRate: Math.round(accuracyRate * 100) / 100,
      },
      riskDistribution,
      recentPredictions,
    },
  })
})
