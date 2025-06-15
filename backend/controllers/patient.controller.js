import asyncHandler from "../middleware/asyncHandler.js"
import Patient from "../models/Patient.model.js"
import websocketService from "../services/websocket.service.js"
// import notificationService from "../services/notification.service.js"

import Prediction from "../models/Prediction.model.js"
import PDFDocument from "pdfkit";
import { scanDocument } from "../services/scanDocument.js";
import fs from "fs";
// @desc    Get all patients
// @route   GET /api/patients
// @access  Private/Doctor
// @desc    Get all patients
// @route   GET /api/patients
// @access  Private/Admin or Doctor
export const getPatients = asyncHandler(async (req, res) => {
  const page = Number.parseInt(req.query.page, 10) || 1;
  const limit = Number.parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  // Build filter
  const filter = {};

  // 1️⃣ Role-based filtering
  if (req.query.doctorId) {
    // Admin or doctor querying a specific doctorId
    filter.doctor = req.query.doctorId;
  } else if (req.user.role === "doctor") {
    // Doctor → only their patients
    filter.doctor = req.user.id;
  }
  // Admin with no doctorId → return all patients

  // 2️⃣ Search filter
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, "i");
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
    ];
  }

  // 3️⃣ Status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Fetch data
  try {
    const total = await Patient.countDocuments(filter);

    const patients = await Patient.find(filter)
      .populate("doctor", "name email specialization") // ✅ THIS populates doctor correctly
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    // Pagination
    const pagination = {};
    if (startIndex + limit < total) {
      pagination.next = {
        page: page + 1,
        limit,
      };
    }
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit,
      };
    }

    res.status(200).json({
      success: true,
      count: patients.length,
      total,
      pagination,
      data: patients,
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching patients",
      error: error.message,
    });
  }
});

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
  const patient = await Patient.findById(req.params.id).populate("doctor", "name email");

  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  // Check access
  if (req.user.role === "doctor" && patient.doctor._id.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized to export this patient's data");
  }

  // Get predictions
  const predictions = await Prediction.find({ patient: req.params.id })
    .populate("doctor", "name")
    .sort({ createdAt: -1 })
    .lean({ virtuals: true }); // ensure virtuals (like riskLevel) are available

  // Set PDF headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=medical-records-${patient.fullName}.pdf`
  );

  // Create PDF document
  const doc = new PDFDocument();
  doc.pipe(res);

  // Patient Info
  doc.fontSize(20).text(`Medical Records - ${patient.fullName}`, { underline: true });
  doc.moveDown();
  doc.fontSize(14).text(`Email: ${patient.email || "N/A"}`);
  doc.text(`Phone: ${patient.phone || "N/A"}`);
  doc.text(`DOB: ${patient.dateOfBirth ? patient.dateOfBirth.toDateString() : "N/A"}`);
  doc.text(`Gender: ${patient.gender || "N/A"}`);
  doc.text(`Doctor: ${patient.doctor.name}`);

  // Diagnoses
  doc.moveDown().fontSize(16).text("Diagnoses:");
  doc.fontSize(14).text(`Primary: ${patient.diag_1 || "N/A"}`);
  doc.text(`Secondary: ${patient.diag_2 || "N/A"}`);
  doc.text(`Tertiary: ${patient.diag_3 || "N/A"}`);

  // Predictions
  doc.moveDown().fontSize(16).text("Predictions:");
  if (predictions.length === 0) {
    doc.fontSize(14).text("No predictions found.");
  } else {
    predictions.forEach((pred, index) => {
      doc.moveDown().fontSize(14).text(`Prediction #${index + 1}:`);
      doc.text(`Result: ${pred.predictionResult}`);
      doc.text(`Risk Level: ${pred.riskLevel || "N/A"}`);
      doc.text(`Confidence: ${(pred.confidence * 100).toFixed(1)}%`);
      doc.text(`Disease Types: ${pred.diseaseTypes && pred.diseaseTypes.length > 0 ? pred.diseaseTypes.join(", ") : "N/A"}`);
      doc.text(`Recommendations:`);
      if (pred.recommendations && pred.recommendations.length > 0) {
        pred.recommendations.forEach((rec) => {
          doc.text(`  • ${rec}`);
        });
      } else {
        doc.text("  N/A");
      }
      doc.text(`Doctor: ${pred.doctor.name}`);
      doc.text(`Status: ${pred.status}`);
      doc.text(`Created At: ${new Date(pred.createdAt).toDateString()}`);
    });
  }

  // Finalize PDF
  doc.end();
});


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
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  if (req.user.role === "doctor" && patient.doctor.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized");
  }

  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("Please upload at least one file");
  }

  const uploadedFiles = [];

  for (const file of req.files) {
    console.log("📄 Scanning:", file.path);

    const scannedText = await scanDocument(file.path);

    const parsedData = {
      diagnosis: scannedText.match(/Diagnosis:\s*(.*)/)?.[1] || "",
      medications: scannedText.match(/Medications:\s*(.*)/)?.[1]?.split(",") || [],
      allergies: scannedText.match(/Allergies:\s*(.*)/)?.[1]?.split(",") || [],
    };

    patient.documents.push({
      fileUrl: `/uploads/${file.filename}`,
      originalName: file.originalname,
      scannedText,
      extractedData: parsedData,
      uploadDate: new Date(),
    });

    uploadedFiles.push({
      originalName: file.originalname,
      parsedData,
    });

    // Optional: delete temp file
    fs.unlinkSync(file.path);
  }

  await patient.save();

  res.json({
    success: true,
    uploadedFiles,
    message: "Files uploaded and scanned",
  });
});
