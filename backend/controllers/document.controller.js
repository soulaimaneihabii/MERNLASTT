// controllers/documentController.js
import ScannedDocumentData from "../models/ScannedDocumentData.js";

// ✅ Helper for keyword-based field extraction
const extractFieldsFromText = (text, type) => {
  const lower = text.toLowerCase();
  const fields = {};

  console.log("🔍 Extracting fields from OCR text for type:", type);

  if (type === "resultat_analyse") {
    if (lower.includes("a1c > 7")) fields.A1Cresult = ">7";
    if (lower.includes("glucose > 200")) fields.max_glu_serum = ">200";
    fields.resumeAnalyse = "Résumé généré automatiquement à partir des résultats d'analyse.";
  }

  if (type === "lettre_medecin") {
    fields.titreLettre = "Lettre médicale";
    if (lower.includes("dr.")) fields.nomMedecin = "Dr. inconnu";
  }

  if (type === "protocole_traitement") {
    fields.protocoleTitre = "Protocole de traitement détecté";
  }

  if (type === "donnee_patient") {
    if (lower.includes("diabete type 2")) fields.diag_1 = "E11.9";
    if (lower.includes("hypertension")) fields.diag_2 = "I10";
  }

  fields.motsCles = [...new Set(lower.match(/\b[a-z]{6,}\b/g) || [])].slice(0, 10);

  console.log("📄 Extracted fields:", fields);
  return fields;
};

export const extractAndStoreScannedData = async (req, res) => {
  try {
    console.log("📥 Incoming request to /documents/extract-fields");
    console.log("🔧 Request body:", req.body);

    const {
      patientId,
      fileUid,
      fileName,
      fileTypeCategory,
      ocrText,
      doctorId
    } = req.body;

    // 🚨 Check required fields
    if (!patientId || !ocrText || !fileUid || !fileName || !fileTypeCategory || !doctorId) {
      console.warn("⚠️ Missing required fields in request:", req.body);
      return res.status(400).json({ error: "Missing required fields" });
    }

    const extractedFields = extractFieldsFromText(ocrText, fileTypeCategory);

    const entry = await ScannedDocumentData.create({
      patient: patientId,
      fileUid,
      fileName,
      fileTypeCategory,
      rawText: ocrText,
      extractedFields,
      createdBy: doctorId,
    });

    console.log("✅ Document saved successfully:", entry._id);
    res.status(201).json(entry);
  } catch (err) {
    console.error("❌ Error in extractAndStoreScannedData:", err);
    res.status(500).json({ error: err.message });
  }
};
export const getScannedDocsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const docs = await ScannedDocumentData.find({ patient: patientId });
    res.status(200).json(docs);
  } catch (error) {
    console.error("Error fetching scanned documents:", error);
    res.status(500).json({ message: "Failed to fetch scanned documents" });
  }
};