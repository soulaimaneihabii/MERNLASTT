"use client";

import { useState, useEffect } from "react";
import { Button, notification } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import axios from "axios";

const PatientDSEExport = () => {
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch patient data
    const fetchPatientData = async () => {
      try {
        const response = await axios.get("/api/patients/me"); // <- you need this API endpoint
        setPatientData(response.data);
      } catch (error) {
        console.error("Failed to fetch patient data", error);
      }
    };

    fetchPatientData();
  }, []);

  const exportDSE = () => {
    if (!patientData) {
      notification.error({
        message: "No data",
        description: "Patient data is not available.",
      });
      return;
    }

    const dseData = {
      patientId: patientData.id,
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      medicalFiles: patientData.medicalFiles?.map((file) => ({
        name: file.name,
        ocrText: file.ocrText,
        uploadDate: file.uploadDate,
      })),
      exportedAt: new Date().toISOString(),
    };

    const jsonStr = JSON.stringify(dseData, null, 2);

    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `Patient_${patientData.id}_DSE.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    notification.success({
      message: "DSE Exported",
      description: "Your DSE file has been exported successfully.",
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>My DSE File</h1>
      <Button
        type="primary"
        icon={<FileTextOutlined />}
        onClick={exportDSE}
        loading={loading}
      >
        Export My DSE
      </Button>
    </div>
  );
};

export default PatientDSEExport;
