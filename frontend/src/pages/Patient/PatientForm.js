"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Typography,
  notification,
} from "antd";
import {
  FileTextOutlined,
  DownloadOutlined,
  ExperimentOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import {
  fetchPredictionHistory,
  clearError,
} from "../../store/slices/predictionsSlice";
import {
  fetchCurrentPatient,
  fetchCurrentPatientForPatientRole,
} from "../../store/slices/patientsSlice";
import jsPDF from "jspdf";

const { Title, Text } = Typography;

const PatientDSEExport = () => {
  const dispatch = useDispatch();
  const { predictionHistory = [], loading, error } = useSelector((state) => state.predictions);
  const { currentPatient } = useSelector((state) => state.patients);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user?.id) {
      if (user.role === "patient") {
        dispatch(fetchCurrentPatientForPatientRole());
      } else {
        dispatch(fetchCurrentPatient(user.id));
      }
    }
  }, [dispatch, user?.id, user?.role]);

  useEffect(() => {
    if (currentPatient?._id) {
      dispatch(fetchPredictionHistory(currentPatient._id));
    }
  }, [dispatch, currentPatient?._id]);

  useEffect(() => {
    if (error) {
      notification.error({ message: "Error", description: error });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const exportDSEAsPDF = () => {
    
    if (!currentPatient) return;
    const doc = new jsPDF();
    let y = 20;

    const addTitle = (text) => {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(text, 20, y);
      y += 10;
    };

   const addLabelValue = (label, value) => {
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`${label}:`, 25, y);
  doc.text(`${value !== undefined && value !== null ? value : "N/A"}`, 70, y);
  y += 8;
  if (y > 275) {
    doc.addPage(); y = 20;
  }
};
console.log("currentPatient data:", currentPatient);

    const addSection = (title, lines = []) => {
      addTitle(title);
      lines.forEach(([label, value]) => addLabelValue(label, value));
      y += 4;
      doc.line(20, y, 190, y);
      y += 6;
    };

    addTitle("Dossier Santé Électronique (DSE) - Patient");
    y += 5;

    addSection("Informations du patient", [
      ["Nom complet", `${currentPatient.firstName} ${currentPatient.lastName}`],
      ["Email", currentPatient.email],
      ["Téléphone", currentPatient.phone],
      ["Date de naissance", currentPatient.dateOfBirth ? new Date(currentPatient.dateOfBirth).toLocaleDateString() : "N/A"],
    ]);

 addSection("Adresse", [
  ["Rue", currentPatient.address?.street || "N/A"],
  ["Ville", currentPatient.address?.city || "N/A"],
  ["État", currentPatient.address?.state || "N/A"],
  ["Code Postal", currentPatient.address?.zipCode || "N/A"],
]);

addSection("Contact d'urgence", [
  ["Nom", currentPatient.emergencyContact?.name || "N/A"],
  ["Relation", currentPatient.emergencyContact?.relationship || "N/A"],
  ["Téléphone", currentPatient.emergencyContact?.phone || "N/A"],
]);

    addSection("Diagnostiques", [
      ["Principal", currentPatient.diag_1],
      ["Secondaire", currentPatient.diag_2],
      ["Tertiaire", currentPatient.diag_3],
    ]);

  addTitle("Médicaments actuels");
if (Array.isArray(currentPatient.currentMedications) && currentPatient.currentMedications.length > 0) {
  currentPatient.currentMedications.forEach((med) => {
    doc.setFont("helvetica", "normal");
    doc.text(`• ${med.name || "N/A"} (${med.dosage || "N/A"}, ${med.frequency || "N/A"})`, 25, y);
    y += 8;
    if (y > 275) {
      doc.addPage(); y = 20;
    }
  });
} else {
  doc.setFont("helvetica", "bold");
  doc.text("Aucun", 25, y);
  y += 8;
}

    y += 4;
    doc.line(20, y, 190, y);
    y += 6;

    addTitle("Documents médicaux");
    if (Array.isArray(currentPatient.medicalFiles) && currentPatient.medicalFiles.length > 0) {
      currentPatient.medicalFiles.forEach((file) => {
        doc.setFont("helvetica", "bold");
        doc.text(`• ${file.name} (${new Date(file.uploadDate).toLocaleDateString()})`, 25, y);
        y += 8;
      });
    } else {
      doc.text("Aucun", 25, y);
      y += 8;
    }
    y += 4;
    doc.line(20, y, 190, y);
    y += 6;

    addSection("Hospitalisations et visites", [
      ["Durée hôpital", `${currentPatient.time_in_hospital ?? "N/A"} jours`],
      ["Consultations externes", currentPatient.number_outpatient],
      ["Urgences", currentPatient.number_emergency],
      ["Hospitalisations", currentPatient.number_inpatient],
    ]);

    addTitle("Historique de prédictions");
    if (predictionHistory.length > 0) {
      predictionHistory.forEach((p) => {
        doc.setFont("helvetica", "normal");
        doc.text(`• ${new Date(p.createdAt).toLocaleDateString()} | ${p.predictionResult} (${(p.confidence * 100).toFixed(1)}%)`, 25, y);
        y += 8;
      });
    } else {
      doc.text("Aucune prédiction trouvée.", 25, y);
      y += 8;
    }

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text("Page " + i + " / " + totalPages, 105, 285, { align: "center" });
      doc.text("Contact: support@clinicai.com", 105, 292, { align: "center" });
    }

    doc.save("Patient_DSE_Report.pdf");
  };

  const totalPredictions = predictionHistory.length;
  const recentPredictions = predictionHistory.filter(p => new Date(p.createdAt) > new Date(Date.now() - 30 * 86400000)).length;
  const highRiskPredictions = predictionHistory.filter(p => p.predictionResult === "High").length;

  return (
    <div>
      <Title level={2}>Exporter mon DSE</Title>
      <Text type="secondary">Cliquez ci-dessous pour générer un PDF complet de vos données médicales.</Text>

      <Row gutter={16} style={{ marginTop: 24, marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="Total des Prédictions" value={totalPredictions} prefix={<ExperimentOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="30 derniers jours" value={recentPredictions} prefix={<CalendarOutlined />} valueStyle={{ color: "#1890ff" }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Alertes Haut Risque" value={highRiskPredictions} prefix={<ExperimentOutlined />} valueStyle={{ color: "#cf1322" }} /></Card></Col>
        <Col span={6}><Card><Statistic title="Dernière mise à jour" value={predictionHistory[0]?.createdAt ? new Date(predictionHistory[0].createdAt).toLocaleDateString() : "Aucune donnée"} prefix={<FileTextOutlined />} /></Card></Col>
      </Row>

      <Row justify="center" style={{ marginBottom: 32 }}>
        <Button type="primary" icon={<DownloadOutlined />} onClick={exportDSEAsPDF} size="large">
          Exporter mon DSE en PDF
        </Button>
      </Row>
    </div>
  );
};

export default PatientDSEExport;
