"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, notification } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchCurrentPatientForPatientRole } from "../../store/slices/patientsSlice";
import { fetchScannedDocuments } from "../../store/slices/scannedDocumentsSlice";
import { fetchPredictionHistory } from "../../store/slices/predictionsSlice";

const Exportpage = () => {
  const dispatch = useDispatch();
  const { currentPatient } = useSelector((state) => state.patients);
  const { data: scannedDocs } = useSelector((state) => state.scannedDocuments);
  const { predictionHistory = [] } = useSelector((state) => state.predictions);

  useEffect(() => {
    dispatch(fetchCurrentPatientForPatientRole());
  }, [dispatch]);

  useEffect(() => {
    if (currentPatient?._id) {
      dispatch(fetchScannedDocuments(currentPatient._id));
      dispatch(fetchPredictionHistory(currentPatient._id));
    }
  }, [dispatch, currentPatient?._id]);

  const exportDSE = () => {
    if (!currentPatient) {
      notification.error({
        message: "Erreur",
        description: "Patient introuvable.",
      });
      return;
    }

    const doc = new jsPDF();
    autoTable(doc); // Register the plugin
    let y = 20;

    const addTable = (title, body) => {
      doc.setFontSize(12);
      doc.text(title, 20, y);
      y += 6;

      doc.autoTable({
        startY: y,
        head: [[]],
        body,
        styles: { fontSize: 10, cellPadding: 3 },
        theme: "grid",
        margin: { top: 10, bottom: 10 },
        didDrawPage: (data) => {
          y = data.cursor.y + 10;
        },
      });
    };

    const patientInfo = [
      ["Nom complet", `${currentPatient.firstName} ${currentPatient.lastName}`],
      ["Email", currentPatient.email],
      ["Téléphone", currentPatient.phone],
      ["Sexe", currentPatient.gender],
      ["Date de naissance", new Date(currentPatient.dateOfBirth).toLocaleDateString()],
      ["Âge", currentPatient.calculatedAge ?? currentPatient.age],
      ["Adresse", `${currentPatient.address?.street ?? ''}, ${currentPatient.address?.city ?? ''}, ${currentPatient.address?.state ?? ''} ${currentPatient.address?.zipCode ?? ''}`],
      ["Contact d'urgence", `${currentPatient.emergencyContact?.name ?? ''} (${currentPatient.emergencyContact?.relationship ?? ''}) - ${currentPatient.emergencyContact?.phone ?? ''}`],
    ];

    addTable("Informations personnelles", patientInfo);

    const documentsTable = [];
    if (Array.isArray(scannedDocs)) {
      scannedDocs.forEach((docu) => {
        documentsTable.push(["Fichier", docu.fileName]);
        documentsTable.push(["Catégorie", docu.fileTypeCategory]);
        if (docu.extractedFields?.resumeAnalyse) {
          documentsTable.push(["Résumé", docu.extractedFields.resumeAnalyse]);
        }
        if (docu.rawText) {
          const cleaned = docu.rawText.replace(/[\u0000-\u001F\u007F-\u009F\u00A0-\u00BF\uFFFD]+/g, "").substring(0, 300);
          documentsTable.push(["Contenu", cleaned + (docu.rawText.length > 300 ? "..." : "")]);
        }
        documentsTable.push(["", ""]);
      });
    }
    addTable("Documents médicaux extraits", documentsTable);

    const predictionTable = [];
    if (Array.isArray(predictionHistory)) {
      predictionHistory.forEach((pred) => {
        predictionTable.push(["Date", new Date(pred.createdAt).toLocaleDateString()]);
        predictionTable.push(["Résultat", pred.predictionResult]);
        predictionTable.push(["Confiance", `${(pred.confidence * 100).toFixed(1)}%`]);
        if (Array.isArray(pred.recommendations)) {
          pred.recommendations.forEach((rec, idx) => {
            predictionTable.push([`Recommandation ${idx + 1}`, rec]);
          });
        }
        predictionTable.push(["", ""]);
      });
    }
    addTable("Historique des prédictions", predictionTable);

    addTable("Exportation", [["Date", new Date().toLocaleString()]]);

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Page ${i} / ${totalPages}`, 105, 290, { align: "center" });
    }

    doc.save(`DSE_${currentPatient.lastName || "patient"}.pdf`);
    notification.success({ message: "Export Réussi", description: "Le fichier DSE PDF a été généré avec succès." });
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>Exporter Mon DSE (Dossier Santé Électronique)</h1>
      <Button type="primary" icon={<FileTextOutlined />} onClick={exportDSE}>
        Exporter le DSE en PDF
      </Button>
    </div>
  );
};

export default Exportpage;
