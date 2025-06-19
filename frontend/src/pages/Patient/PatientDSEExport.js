"use client";

import { useState, useEffect } from "react";
import { Button, notification } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import axios from "axios";

const Exportpage = () => {
  const [patientData, setPatientData] = useState(null);
  const [extractedDocs, setExtractedDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const response = await axios.get("/api/patients/me");
        setPatientData(response.data);

        const docRes = await axios.get(`/api/scanned-documents/by-patient/${response.data._id}`);
        setExtractedDocs(docRes.data);
      } catch (error) {
        console.error("Failed to fetch patient data", error);
        notification.error({
          message: "Erreur",
          description: "Impossible de récupérer les données du patient.",
        });
      }
    };

    fetchPatientData();
  }, []);

  const exportDSE = () => {
    if (!patientData) {
      notification.error({
        message: "Données manquantes",
        description: "Les données du patient ne sont pas disponibles.",
      });
      return;
    }

    const dseData = {
      patientId: patientData._id,
      name: patientData.fullName,
      email: patientData.email,
      age: patientData.age,
      gender: patientData.gender,
      medications: patientData.currentMedications || [],
      labTests: patientData.num_lab_procedures,
      hospitalizations: patientData.number_inpatient,
      emergencies: patientData.number_emergency,
      medicalFiles: patientData.medicalFiles?.map((file) => ({
        name: file.name,
        url: file.url,
        uploadDate: file.uploadDate,
        type: file.type,
        size: file.size,
      })) || [],
      extractedDocuments: extractedDocs.map(doc => ({
        fileName: doc.fileName,
        category: doc.fileTypeCategory,
        rawText: doc.rawText,
        fields: doc.extractedFields,
        createdAt: doc.createdAt,
      })),
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(dseData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DSE_${patientData.fullName || "patient"}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notification.success({
      message: "Export Réussi",
      description: "Votre fichier DSE a été téléchargé.",
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>📄 Exporter Mon DSE (Dossier Santé Électronique)</h1>
      <Button
        type="primary"
        icon={<FileTextOutlined />}
        onClick={exportDSE}
        loading={loading}
      >
        Exporter le DSE
      </Button>
    </div>
  );
};

export default Exportpage;
