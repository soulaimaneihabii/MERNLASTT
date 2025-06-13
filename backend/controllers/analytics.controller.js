import asyncHandler from "../middleware/asyncHandler.js"
import User from "../models/User.model.js"
import Patient from "../models/Patient.model.js"
import Prediction from "../models/Prediction.model.js"
import aiService from "../services/ai.service.js"

// @desc    Get dashboard statistics
// @route   GET /api/analytics/dashboard
// @access  Private/Doctor or Admin
// @desc    Get dashboard statistics
// @route   GET /api/analytics/dashboard
// @access  Private/Admin or Doctor
export const getDashboardStats = asyncHandler(async (req, res) => {
  const isDoctor = req.user.role === "doctor";
  const matchCondition = isDoctor ? { doctor: req.user.id } : {};

  // Basic counts
  const [totalPatients, totalPredictions, recentPredictions, highRiskPredictions] = await Promise.all([
    Patient.countDocuments(matchCondition),
    Prediction.countDocuments(matchCondition),
    Prediction.countDocuments({
      ...matchCondition,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
    Prediction.countDocuments({
      ...matchCondition,
      predictionResult: { $in: ["High Risk", "Critical Risk", "High"] },
    }),
  ]);

  // Accuracy stats
  const accuracyStats = await Prediction.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        confirmed: {
          $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] },
        },
        rejected: {
          $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
        },
        pending: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
      },
    },
  ]);
  const accuracy = accuracyStats[0];
  const accuracyRate = accuracy ? (accuracy.confirmed / accuracy.total) * 100 : 0;

  // Recent predictions
  const recentActivity = await Prediction.find(matchCondition)
    .populate("patient", "firstName lastName age")
    .populate("doctor", "name")
    .sort({ createdAt: -1 })
    .limit(5)
    .select("predictionResult confidence status createdAt");

  // ✅ Fix for Risk Distribution
  const rawPredictions = await Prediction.find(matchCondition).select("predictionResult");
  let riskDistribution = { high: 0, medium: 0, low: 0 };

  rawPredictions.forEach(p => {
    const level = (p.predictionResult || "").toLowerCase().trim();
    if (["high", "high risk", "critical", "critical risk"].includes(level)) {
      riskDistribution.high++;
    } else if (["moderate", "medium", "medium risk"].includes(level)) {
      riskDistribution.medium++;
    } else if (["low", "low risk"].includes(level)) {
      riskDistribution.low++;
    }
  });

  const riskDistributionArray = [
    { _id: "High", count: riskDistribution.high },
    { _id: "Medium", count: riskDistribution.medium },
    { _id: "Low", count: riskDistribution.low }
  ];

  // Admin-only user stats
  let userStats = null;
  if (req.user.role === "admin") {
    const users = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
          },
        },
      },
    ]);

    const totalUsers = await User.countDocuments();
    const totalDoctors = await User.countDocuments({ role: "doctor" });
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const activeUsers = await User.countDocuments({ isActive: true });

    userStats = {
      totalUsers,
      totalDoctors,
      totalAdmins,
      activeUsers,
      roleDistribution: users,
    };
  }

  // ✅ Final response
  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalPatients,
        totalPredictions,
        recentPredictions,
        highRiskPredictions,
        accuracyRate: Math.round(accuracyRate * 100) / 100,
      },
      accuracy: accuracy || { total: 0, confirmed: 0, rejected: 0, pending: 0 },
      riskDistribution: riskDistributionArray,
      recentActivity,
      userStats,
    },
  });
});




// @desc    Get prediction analytics
// @route   GET /api/analytics/predictions
// @access  Private/Doctor or Admin
export const getPredictionAnalytics = asyncHandler(async (req, res) => {
  const isDoctor = req.user.role === "doctor"
  const matchCondition = isDoctor ? { doctor: req.user.id } : {}

  // Parse period parameter
  const period = req.query.period || "30d"
  const periodMap = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
  }

  const days = periodMap[period] || 30
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // Get predictions over time
  const predictionsOverTime = await Prediction.aggregate([
    {
      $match: {
        ...matchCondition,
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
          },
        },
        count: { $sum: 1 },
        highRisk: {
          $sum: {
            $cond: [{ $in: ["$predictionResult", ["High Risk", "Critical Risk"]] }, 1, 0],
          },
        },
        avgConfidence: { $avg: "$confidence" },
      },
    },
    { $sort: { _id: 1 } },
  ])

  // Get confidence distribution
  const confidenceDistribution = await Prediction.aggregate([
    { $match: matchCondition },
    {
      $bucket: {
        groupBy: "$confidence",
        boundaries: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
        default: "Other",
        output: {
          count: { $sum: 1 },
          avgConfidence: { $avg: "$confidence" },
        },
      },
    },
  ])

  // Get disease type distribution
  const diseaseDistribution = await Prediction.aggregate([
    { $match: matchCondition },
    {
      $project: {
        maxDisease: {
          $switch: {
            branches: [
              {
                case: {
                  $and: [
                    { $gte: ["$diseaseTypes.diabetes", "$diseaseTypes.cardiovascular"] },
                    { $gte: ["$diseaseTypes.diabetes", "$diseaseTypes.other"] },
                  ],
                },
                then: "diabetes",
              },
              {
                case: {
                  $and: [
                    { $gte: ["$diseaseTypes.cardiovascular", "$diseaseTypes.diabetes"] },
                    { $gte: ["$diseaseTypes.cardiovascular", "$diseaseTypes.other"] },
                  ],
                },
                then: "cardiovascular",
              },
            ],
            default: "other",
          },
        },
      },
    },
    {
      $group: {
        _id: "$maxDisease",
        count: { $sum: 1 },
      },
    },
  ])

  // Get monthly trends
  const monthlyTrends = await Prediction.aggregate([
    {
      $match: {
        ...matchCondition,
        createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
        accuracy: {
          $avg: {
            $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0],
          },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ])

  res.status(200).json({
    success: true,
    data: {
      predictionsOverTime,
      confidenceDistribution,
      diseaseDistribution,
      monthlyTrends,
      period,
    },
  })
})

// @desc    Get patient analytics
// @route   GET /api/analytics/patients
// @access  Private/Doctor or Admin
export const getPatientAnalytics = asyncHandler(async (req, res) => {
  const isDoctor = req.user.role === "doctor"
  const matchCondition = isDoctor ? { doctor: req.user.id } : {}

  // Age distribution
  const ageDistribution = await Patient.aggregate([
    { $match: matchCondition },
    {
      $bucket: {
        groupBy: "$age",
        boundaries: [0, 18, 30, 45, 60, 75, 120],
        default: "Unknown",
        output: {
          count: { $sum: 1 },
          avgAge: { $avg: "$age" },
        },
      },
    },
  ])

  // Gender distribution
  const genderDistribution = await Patient.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: "$gender",
        count: { $sum: 1 },
      },
    },
  ])

  // Race distribution
  const raceDistribution = await Patient.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: "$race",
        count: { $sum: 1 },
      },
    },
  ])

  // Patient registration over time
  const registrationTrends = await Patient.aggregate([
    {
      $match: {
        ...matchCondition,
        createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])

  // Risk factor analysis
  const riskFactorAnalysis = await Patient.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        avgAge: { $avg: "$age" },
        diabetesMedCount: {
          $sum: { $cond: [{ $eq: ["$diabetesMed", "Yes"] }, 1, 0] },
        },
        highGlucoseCount: {
          $sum: { $cond: [{ $in: ["$max_glu_serum", [">200", ">300"]] }, 1, 0] },
        },
        highA1CCount: {
          $sum: { $cond: [{ $in: ["$A1Cresult", [">7", ">8"]] }, 1, 0] },
        },
        avgHospitalStay: { $avg: "$time_in_hospital" },
        avgEmergencyVisits: { $avg: "$number_emergency" },
      },
    },
  ])

  res.status(200).json({
    success: true,
    data: {
      ageDistribution,
      genderDistribution,
      raceDistribution,
      registrationTrends,
      riskFactorAnalysis: riskFactorAnalysis[0] || {},
    },
  })
})

// @desc    Get user analytics
// @route   GET /api/analytics/users
// @access  Private/Admin
export const getUserAnalytics = asyncHandler(async (req, res) => {
  // User activity over time
  const userActivity = await User.aggregate([
    {
      $match: {
        lastLogin: { $exists: true },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$lastLogin",
          },
        },
        activeUsers: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 30 },
  ])

  // Role distribution
  const roleDistribution = await User.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
        },
      },
    },
  ])

  // Department distribution
  const departmentDistribution = await User.aggregate([
    {
      $match: { department: { $exists: true, $ne: null } },
    },
    {
      $group: {
        _id: "$department",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ])

  // User registration trends
  const registrationTrends = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])

  res.status(200).json({
    success: true,
    data: {
      userActivity,
      roleDistribution,
      departmentDistribution,
      registrationTrends,
    },
  })
})

// @desc    Get system health metrics
// @route   GET /api/analytics/system-health
// @access  Private/Admin
export const getSystemHealth = asyncHandler(async (req, res) => {
  // Database health
  const dbHealth = {
    status: "healthy",
    collections: {
      users: await User.countDocuments(),
      patients: await Patient.countDocuments(),
      predictions: await Prediction.countDocuments(),
    },
  }

  // AI service health
  const aiHealth = await aiService.getAIServiceHealth()

  // System metrics
  const systemMetrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString(),
  }

  // Recent errors (you would implement error logging)
  const recentErrors = []

  // Performance metrics
  const performanceMetrics = {
    avgResponseTime: "150ms", // You would calculate this from logs
    requestsPerMinute: 45, // You would calculate this from logs
    errorRate: 0.02, // You would calculate this from logs
  }

  res.status(200).json({
    success: true,
    data: {
      database: dbHealth,
      aiService: aiHealth,
      system: systemMetrics,
      performance: performanceMetrics,
      recentErrors,
    },
  })
})
export const getPatientsPerDoctor = asyncHandler(async (req, res) => {
    const patientsPerDoctor = await Patient.aggregate([
        { $match: { doctor: { $ne: null } } },
        {
            $group: {
                _id: "$doctor",
                count: { $sum: 1 },
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "doctorInfo",
            },
        },
        { $unwind: "$doctorInfo" },
        {
            $project: {
                doctor: "$doctorInfo.name",
                patients: "$count",
            },
        },
    ]);

    res.status(200).json({
        success: true,
        data: patientsPerDoctor,
    });
});