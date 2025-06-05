import asyncHandler from "../middleware/asyncHandler.js"
import Patient from "../models/Patient.model.js"
import websocketService from "../services/websocket.service.js"
// import notificationService from "../services/notification.service.js"
import aiService from "../services/ai.service.js"
import Prediction from "../models/Prediction.model.js"

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private/Doctor
export const getPatients = asyncHandler(async (req, res) => {
  const page = Number.parseInt(req.query.page, 10) || 1
  const limit = Number.parseInt(req.query.limit, 10) || 10
  const startIndex = (page - 1) * limit

  // Build filter based on user role and query parameters
  const filter = {}

  // Handle doctorId query parameter
  if (req.query.doctorId) {
    filter.doctor = req.query.doctorId
  } else if (req.user.role === "doctor") {
    // If no doctorId specified and user is a doctor, filter by their own patients
    filter.doctor = req.user.id
  }
  // If user is admin and no doctorId specified, return all patients (no filter)

  // Add search functionality
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, "i")
    filter.$or = [{ firstName: searchRegex }, { lastName: searchRegex }, { email: searchRegex }]
  }

  // Add status filter
  if (req.query.status) {
    filter.status = req.query.status
  }

  try {
    // Get total count for pagination
    const total = await Patient.countDocuments(filter)

    // Get patients with pagination
    const patients = await Patient.find(filter)
      .populate("doctor", "name email specialization")
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
      count: patients.length,
      total,
      pagination,
      data: patients,
      filter: filter, // Include filter in response for debugging
    })
  } catch (error) {
    console.error("Error fetching patients:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching patients",
      error: error.message,
    })
  }
})

// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private/Doctor
export const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).populate("doctor", "name email")

  if (!patient) {
    res.status(404)
    throw new Error("Patient not found")
  }

  // Check if doctor has access to this patient
  if (req.user.role === "doctor" && patient.doctor._id.toString() !== req.user.id) {
    res.status(403)
    throw new Error("Not authorized to access this patient")
  }

  res.status(200).json({
    success: true,
    data: patient,
  })
})

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private/Doctor
export const createPatient = asyncHandler(async (req, res) => {
  const {
    // Linking fields (VERY IMPORTANT)
    user,   // ✅ MUST extract!
    doctor, // ✅ MUST extract!

    // Basic Information
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,

    // Medical Data for AI
    age,
    gender,
    race,
    diag_1,
    diag_2,
    diag_3,

    // Test Results
    max_glu_serum,
    A1Cresult,
    insulin,
    metformin,
    diabetesMed,

    // Hospital Statistics
    time_in_hospital,
    num_lab_procedures,
    num_procedures,
    num_medications,
    number_outpatient,
    number_emergency,
    number_inpatient,
    number_diagnoses,

    // Additional Information
    address,
    emergencyContact,
    allergies,
    currentMedications,
    medicalHistory,
    medicalFiles,
    notes,
  } = req.body;

  // Check if patient for this user already exists!
  const existingPatient = await Patient.findOne({ user });
  if (existingPatient) {
    return res.status(400).json({
      success: false,
      message: "Patient for this user already exists",
    });
  }

  // Calculate age if needed
  let calculatedAge = age;
  if (!calculatedAge && dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
  }

  // Create patient
  const patient = await Patient.create({
    // Linking fields
    user,
    doctor,

    // Basic Information
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,

    // Medical Data for AI
    age: calculatedAge,
    gender,
    race,
    diag_1,
    diag_2: diag_2 || null,
    diag_3: diag_3 || null,

    // Test Results
    max_glu_serum: max_glu_serum || "None",
    A1Cresult: A1Cresult || "None",
    insulin: insulin || "No",
    metformin: metformin || "No",
    diabetesMed: diabetesMed || "No",

    // Hospital Statistics
    time_in_hospital,
    num_lab_procedures,
    num_procedures,
    num_medications,
    number_outpatient,
    number_emergency,
    number_inpatient,
    number_diagnoses,

    // Address
    address,
    emergencyContact,
    allergies: allergies || [],
    currentMedications: currentMedications || [],
    medicalHistory: medicalHistory || [],
    medicalFiles: medicalFiles || [],
    notes: notes || "",

    // System fields
    status: "Active",
    lastVisit: new Date(),
  });

  // Populate doctor
  await patient.populate("doctor", "name email");

  res.status(201).json({
    success: true,
    data: patient,
    message: "Patient created successfully",
  });
});

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private/Doctor
// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private/Doctor
export const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  // Check if doctor has access to this patient
  if (req.user.role === "doctor" && patient.doctor.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to update this patient");
  }

  // ✅ FIXED: Include "user" and "doctor"!!
  const allowedFields = [
    "user", // 🚀 REQUIRED — Mongoose needs it
    "doctor", // Optional (allow doctor update)

    "firstName",
    "lastName",
    "email",
    "phone",
    "dateOfBirth",
    "address",
    "emergencyContact",
    "allergies",
    "currentMedications",
    "medicalHistory",
    "medicalFiles",
    "notes",
    "status",
    "age",
    "gender",
    "race",
    "diag_1",
    "diag_2",
    "diag_3",
    "max_glu_serum",
    "A1Cresult",
    "insulin",
    "metformin",
    "diabetesMed",
    "time_in_hospital",
    "num_lab_procedures",
    "num_procedures",
    "num_medications",
    "number_outpatient",
    "number_emergency",
    "number_inpatient",
    "number_diagnoses",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      patient[field] = req.body[field];
    }
  });

  patient.lastVisit = new Date();
  const updatedPatient = await patient.save();

  res.status(200).json({
    success: true,
    data: updatedPatient,
    message: "Patient updated successfully",
  });
});


// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private/Admin
import User from "../models/User.model.js";

export const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  // Authorization check: only Admin or Doctor who owns this patient
  if (req.user.role === "doctor" && patient.doctor.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to delete this patient");
  }

  // Delete linked User (important!)
  const userId = patient.user;

  if (userId) {
    const user = await User.findById(userId);
    if (user) {
      await user.deleteOne();
      console.log(`Linked user ${user.email} deleted`);
    } else {
      console.warn(`Linked user ${userId} not found`);
    }
  }

  // Now delete patient
  await patient.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
    message: "Patient and linked User deleted successfully",
  });
});


// @desc    Export patient data
// @route   GET /api/patients/:id/export
// @access  Private/Doctor or Admin
export const exportPatientData = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).populate("doctor", "name email")

  if (!patient) {
    res.status(404)
    throw new Error("Patient not found")
  }

  // Check if doctor has access to this patient
  if (req.user.role === "doctor" && patient.doctor._id.toString() !== req.user.id) {
    res.status(403)
    throw new Error("Not authorized to export this patient's data")
  }

  // Get patient's predictions
  const predictions = await Prediction.find({ patient: req.params.id })
    .populate("doctor", "name")
    .sort({ createdAt: -1 })

  // Prepare export data
  const exportData = {
    patient: {
      id: patient._id,
      name: patient.fullName,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      age: patient.age,
      gender: patient.gender,
      race: patient.race,
      address: patient.address,
      emergencyContact: patient.emergencyContact,
      allergies: patient.allergies,
      currentMedications: patient.currentMedications,
      medicalHistory: patient.medicalHistory,
      medicalFiles: patient.medicalFiles,
      notes: patient.notes,
      status: patient.status,
      doctor: patient.doctor.name,
      createdAt: patient.createdAt,
      lastVisit: patient.lastVisit,
    },
    medicalData: {
      diagnoses: {
        primary: patient.diag_1,
        secondary: patient.diag_2,
        tertiary: patient.diag_3,
      },
      testResults: {
        maxGlucoseSerum: patient.max_glu_serum,
        a1cResult: patient.A1Cresult,
        insulin: patient.insulin,
        metformin: patient.metformin,
        diabetesMed: patient.diabetesMed,
      },
      hospitalStats: {
        timeInHospital: patient.time_in_hospital,
        labProcedures: patient.num_lab_procedures,
        procedures: patient.num_procedures,
        medications: patient.num_medications,
        outpatientVisits: patient.number_outpatient,
        emergencyVisits: patient.number_emergency,
        inpatientVisits: patient.number_inpatient,
        totalDiagnoses: patient.number_diagnoses,
      },
    },
    predictions: predictions.map((pred) => ({
      id: pred._id,
      result: pred.predictionResult,
      confidence: pred.confidence,
      diseaseTypes: pred.diseaseTypes,
      riskFactors: pred.riskFactors,
      recommendations: pred.recommendations,
      status: pred.status,
      notes: pred.notes,
      doctor: pred.doctor.name,
      createdAt: pred.createdAt,
    })),
    exportedAt: new Date().toISOString(),
    exportedBy: req.user.name,
  }

  res.status(200).json({
    success: true,
    data: exportData,
    message: "Patient data exported successfully",
  })
})

// @desc    Validate patient data for AI prediction
// @route   GET /api/patients/:id/validate-prediction-data
// @access  Private/Doctor or Admin
export const getCurrentPatient = asyncHandler(async (req, res) => {
  const patientWithUser = await Patient.findOne({ user: req.user.id });

  if (!patientWithUser) {
    return res.status(404).json({
      success: false,
      message: "Patient not found for this user",
    });
  }

  res.status(200).json({
    success: true,
    data: patientWithUser,
  });
});

export const validatePredictionData = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: "Patient not found",
    })
  }

  // Check if user has access to this patient
  if (req.user.role === "doctor" && patient.doctor.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to access this patient",
    })
  }

  // Get AI prediction data
  const predictionData = patient.getAIPredictionData()

  // Validate the data
  const validation = aiService.validatePredictionData(predictionData)

  res.status(200).json({
    success: true,
    data: {
      patient: {
        id: patient._id,
        name: patient.fullName,
        age: patient.age,
      },
      validation,
      predictionData: validation.isValid ? predictionData : null,
    },
  })
})

// @desc    Upload medical file for patient
// @route   POST /api/patients/:id/upload
// @access  Private/Doctor or Admin
export const uploadMedicalFile = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)

  if (!patient) {
    res.status(404)
    throw new Error("Patient not found")
  }

  // Check if doctor has access to this patient
  if (req.user.role === "doctor" && patient.doctor.toString() !== req.user.id) {
    res.status(403)
    throw new Error("Not authorized to upload files for this patient")
  }

  // Check if file exists
  if (!req.file) {
    res.status(400)
    throw new Error("Please upload a file")
  }

  // Add file to patient's medical files
  const fileData = {
    name: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size,
    uid: req.file.filename,
    url: req.file.path,
    uploadDate: new Date(),
  }

  patient.medicalFiles.push(fileData)
  await patient.save()

  res.status(200).json({
    success: true,
    data: fileData,
    message: "File uploaded successfully",
  })
})
