// models/ScannedDocumentData.js
import mongoose from "mongoose";

const scannedDocumentDataSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.ObjectId,
      ref: "Patient",
      required: true,
    },
    fileUid: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
    },
    fileTypeCategory: {
      type: String,
      enum: [
        "resultat_analyse",
        "lettre_medecin",
        "donnee_patient",
        "image_medicale",
        "protocole_traitement",
        "autre"
      ],
      required: true,
    },
    extractedFields: {
      // 🧪 Lab Results
      resumeAnalyse: { type: String },
      A1Cresult: { type: String },
      max_glu_serum: { type: String },
      diag_1: { type: String },
      diag_2: { type: String },
      diag_3: { type: String },

      // 📝 Doctor Letter
      titreLettre: { type: String },
      nomMedecin: { type: String },

      // 📋 Treatment Protocol
      protocoleTitre: { type: String },

      // 📅 Document Metadata
      dateDocument: { type: Date },

      // 🔍 Keywords and Notes
      motsCles: [String],
      notesSupplementaires: { type: String },

      // 💊 Medication Info
      insulin: { type: String },
      metformin: { type: String },
      diabetesMed: { type: String },

      // 📸 Image Metadata (from radiology or image documents)
      imageType: { type: String }, // e.g., "X-ray", "MRI", "CT"
      regionAnatomique: { type: String },
      observationImage: { type: String },

      // 📁 General Document Context
      sourceSystem: { type: String }, // e.g., "DossierExterne", "CliniSys"
      langue: { type: String }, // Language of the document
      titreDocument: { type: String },
    },
    rawText: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("ScannedDocumentData", scannedDocumentDataSchema);
